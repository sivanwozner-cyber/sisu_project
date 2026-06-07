import type { ChainAdapter, IngestResult } from "./types";
import { decompressFeed } from "./feed-parser";
import { buildPrices, parsePriceFull, parsePromoFull, resolveBranch } from "./normalize";

const SLUG = "shufersal";
const BASE_URL = process.env.SHUFERSAL_BASE_URL ?? "https://prices.shufersal.co.il";

/**
 * Shufersal publishes its transparency feeds via its own portal (not Cerberus).
 * The portal exposes a JSON file-listing API used here — this is the official
 * machine-readable index, not HTML scraping. Override SHUFERSAL_FILES_ENDPOINT
 * if the path differs from the documented convention (verify against the live
 * portal before relying on this in production — see PRD §17).
 */
const FILES_ENDPOINT = process.env.SHUFERSAL_FILES_ENDPOINT ?? `${BASE_URL}/FileObject/UpdateCategory`;

type ShufersalFileEntry = { FileNm: string; SPath?: string; Path?: string };

async function listFiles(category: number): Promise<ShufersalFileEntry[]> {
  const url = `${FILES_ENDPOINT}?catID=${category}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Shufersal file listing failed (cat ${category}): HTTP ${res.status}`);
  const data = (await res.json()) as { Categories?: { Cat?: { Files?: { File?: ShufersalFileEntry[] } }[] }[] };
  const files: ShufersalFileEntry[] = [];
  for (const c of data.Categories ?? []) {
    for (const cat of c.Cat ?? []) {
      for (const f of cat.Files?.File ?? []) files.push(f);
    }
  }
  return files;
}

function latestMatching(files: ShufersalFileEntry[], prefix: string): ShufersalFileEntry | null {
  const matches = files.filter((f) => f.FileNm?.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!matches.length) return null;
  return matches.sort((a, b) => (a.FileNm < b.FileNm ? 1 : -1))[0];
}

async function download(entry: ShufersalFileEntry): Promise<Buffer> {
  const path = entry.SPath ?? entry.Path;
  if (!path) throw new Error(`Shufersal file entry missing download path: ${entry.FileNm}`);
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Shufersal download failed for ${entry.FileNm}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Category IDs per Shufersal's published convention: 1=PriceFull, 2=PromoFull, 5=Stores.
const CAT_PRICE_FULL = 1;
const CAT_PROMO_FULL = 2;
const CAT_STORES = 5;

export const shufersal: ChainAdapter = {
  slug: SLUG,
  async ingest(): Promise<IngestResult> {
    try {
      const [priceFiles, promoFiles, storeFiles] = await Promise.all([
        listFiles(CAT_PRICE_FULL),
        listFiles(CAT_PROMO_FULL),
        listFiles(CAT_STORES),
      ]);

      const priceEntry = latestMatching(priceFiles, "PriceFull");
      if (!priceEntry) {
        console.warn(`[ingestion:${SLUG}] No PriceFull file found on portal — keeping last known data.`);
        return { products: [], prices: [] };
      }
      const promoEntry = latestMatching(promoFiles, "PromoFull");
      const storesEntry = latestMatching(storeFiles, "Stores");

      const [priceBuf, promoBuf, storesBuf] = await Promise.all([
        download(priceEntry),
        promoEntry ? download(promoEntry) : Promise.resolve(null),
        storesEntry ? download(storesEntry) : Promise.resolve(null),
      ]);

      const branch = resolveBranch(storesBuf ? decompressFeed(storesBuf) : null, process.env.SHUFERSAL_BRANCH_ID);

      const { products, pricesByBarcode } = parsePriceFull(decompressFeed(priceBuf), SLUG);
      const promoByBarcode = promoBuf ? parsePromoFull(decompressFeed(promoBuf), SLUG) : new Map<string, number>();

      return { products, prices: buildPrices(SLUG, branch, pricesByBarcode, promoByBarcode) };
    } catch (err) {
      console.error(`[ingestion:${SLUG}] ingest failed:`, err);
      return { products: [], prices: [] };
    }
  },
};
