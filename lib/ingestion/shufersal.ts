import { gunzipSync } from "zlib";
import { XMLParser } from "fast-xml-parser";
import type { ChainAdapter, IngestResult, NormalizedPrice, NormalizedProduct } from "./types";

/**
 * Shufersal (שופרסל) price-transparency adapter.
 *
 * PORTAL DETAILS (verified live on 2026-06-07 against https://prices.shufersal.co.il/):
 * - The portal is a classic ASP.NET MVC page (no login / credentials — public).
 * - The visible file table is populated via an internal AJAX endpoint:
 *     GET /FileObject/UpdateCategory?catID=<id>&storeId=<id>&sort=Time&sortdir=DESC
 *   where catID: 1=Prices (incremental), 2=PricesFull, 3=Promos, 4=PromosFull, 5=Stores.
 *   storeId=0 means "All branches".
 * - Each row contains a direct download URL pointing at Azure Blob Storage with a
 *   short-lived SAS token, e.g.:
 *     https://pricesprodpublic.blob.core.windows.net/pricefull/PriceFull7290027600007-001-357-20260607-034000.gz?sv=...&sig=...&se=...&sp=r
 * - Confirmed filename patterns (chainId is constant: 7290027600007):
 *     PriceFull<chainId>-<subChainId>-<storeId>-<yyyymmdd>-<hhmmss>.gz
 *     PromoFull<chainId>-<subChainId>-<storeId>-<yyyymmdd>-<hhmmss>.gz
 *     Stores<chainId>-<subChainId 000=all>-<yyyymmdd>-<hhmmss-ish>.gz
 * - All three are gzip-compressed XML with a `Root`/`Chain` envelope. Confirmed shapes:
 *     PriceFull: Root > Items > Item > { ItemCode, ItemName, ManufactureName,
 *       ManufactureItemDescription, UnitQty, Quantity, UnitOfMeasure, ItemPrice, ... }
 *       NOTE: the manufacturer field is spelled `ManufactureName` (no trailing "r"),
 *       not `ManufacturerName` as the generic skill doc suggests — adapter accepts both.
 *     PromoFull: Root > Promotions > Promotion > Groups > Group > PromotionItems >
 *       PromotionItem > { ItemCode, DiscountedPrice, MinQty, ... }
 *     Stores: Chain > SubChains > SubChain > Stores > Store > { StoreID, StoreName, ... }
 *
 * MVP / representative-branch decision (deferred per PRD §17):
 * We hardcode a single representative branch rather than aggregating across all ~280
 * stores. Branch 357 ("דיל צורן קדימה- לב השרון", sub-chain 001) was picked because it
 * was the most-recently-updated PriceFull/PromoFull pair at the time of writing and has
 * a non-trivial catalog size (~315KB compressed). Revisit branch selection once the
 * product owner decides on per-branch vs. aggregated pricing (PRD §17).
 */

const CHAIN_ID = "7290027600007";
const SUB_CHAIN_ID = "001";
const STORE_ID = "357";
const STORE_BRANCH = STORE_ID;

const PORTAL_BASE = "https://prices.shufersal.co.il";

const xmlParser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
});

type FileCategory = "pricefull" | "promofull" | "stores";

/** catID values as used by /FileObject/UpdateCategory (verified live). */
const CATEGORY_IDS: Record<FileCategory, number> = {
  pricefull: 2,
  promofull: 4,
  stores: 5,
};

/**
 * Finds the most recent download URL for a given file category + store, by querying
 * the portal's internal listing endpoint (sorted by update time, descending) and
 * extracting the first matching row's Azure Blob SAS link.
 */
async function findLatestFileUrl(category: FileCategory, storeId: string | null): Promise<string | null> {
  const catID = CATEGORY_IDS[category];
  const storeParam = storeId ?? "0";
  const url = `${PORTAL_BASE}/FileObject/UpdateCategory?catID=${catID}&storeId=${storeParam}&sort=Time&sortdir=DESC`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (price-feed-ingestion bot)" },
  });
  if (!res.ok) {
    console.warn(`[shufersal] file listing request failed (${category}): HTTP ${res.status}`);
    return null;
  }
  const html = await res.text();

  // Rows look like: <tr class="webgrid-row-style">...<a href="https://...blob.core.windows.net/...gz?...">Download</a>...
  // We restrict to rows whose filename mentions our target store id (when applicable),
  // since storeId=0 returns "All" branches sorted by time across the whole chain.
  const rowRegex = /<tr class="webgrid-row-style">([\s\S]*?)<\/tr>/g;
  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(html))) {
    const row = match[1];
    const hrefMatch = row.match(/href="(https:\/\/[^"]+\.gz[^"]*)"/);
    if (!hrefMatch) continue;
    const href = hrefMatch[1].replace(/&amp;/g, "&");

    if (category === "stores") {
      // Stores file is chain-wide; the first (most recent) row is what we want.
      return href;
    }

    // Filenames embed the store id, e.g. PriceFull7290027600007-001-357-...
    if (storeId && href.includes(`-${SUB_CHAIN_ID}-${storeId}-`)) {
      return href;
    }
  }

  // Fallback: if we couldn't find a row for our specific store (e.g. listing order
  // changed), take the first row of the category-filtered listing as a best effort.
  const firstHref = html.match(/href="(https:\/\/[^"]+\.gz[^"]*)"/);
  if (firstHref) {
    console.warn(
      `[shufersal] could not find ${category} file for store ${storeId}; falling back to first listed file`
    );
    return firstHref[1].replace(/&amp;/g, "&");
  }

  return null;
}

async function downloadAndGunzip(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[shufersal] download failed: HTTP ${res.status} for ${url}`);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    const xml = gunzipSync(Buffer.from(arrayBuf)).toString("utf-8");
    return xml;
  } catch (err) {
    console.warn(`[shufersal] download/gunzip error for ${url}:`, err);
    return null;
  }
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** Builds a unit string like "439 גרם" or "100 מיליליטר" from UnitQty/Quantity/UnitOfMeasure. */
function buildUnit(unitQty: unknown, quantity: unknown, unitOfMeasure: unknown): string | null {
  const qty = cleanString(quantity);
  const uq = cleanString(unitQty);
  const uom = cleanString(unitOfMeasure);
  if (qty && uq) return `${qty} ${uq}`;
  if (uom) return uom;
  if (uq) return uq;
  return null;
}

type ParsedPriceItem = {
  barcode: string;
  name: string;
  manufacturer: string | null;
  unit: string | null;
  price: number;
};

/** Parses a PriceFull XML document into normalized items, skipping malformed rows. */
function parsePriceFullXml(xml: string): ParsedPriceItem[] {
  let doc: any;
  try {
    doc = xmlParser.parse(xml);
  } catch (err) {
    console.warn("[shufersal] failed to parse PriceFull XML:", err);
    return [];
  }

  const items = toArray<any>(doc?.Root?.Items?.Item);
  const out: ParsedPriceItem[] = [];

  for (const item of items) {
    const barcode = cleanString(item?.ItemCode);
    const name = cleanString(item?.ItemName);
    const price = parseNumber(item?.ItemPrice);

    if (!barcode || !name || price === null) {
      console.warn("[shufersal] skipping malformed PriceFull item:", {
        ItemCode: item?.ItemCode,
        ItemName: item?.ItemName,
        ItemPrice: item?.ItemPrice,
      });
      continue;
    }

    // Observed field is `ManufactureName` (chain's actual spelling); accept the more
    // generically-documented `ManufacturerName` too in case of future format drift.
    const manufacturer = cleanString(item?.ManufactureName ?? item?.ManufacturerName);
    const unit = buildUnit(item?.UnitQty, item?.Quantity, item?.UnitOfMeasure);

    out.push({ barcode, name, manufacturer, unit, price });
  }

  return out;
}

/** Parses a PromoFull XML document into a map of barcode -> best (lowest) discounted price. */
function parsePromoFullXml(xml: string): Map<string, number> {
  const promoByBarcode = new Map<string, number>();

  let doc: any;
  try {
    doc = xmlParser.parse(xml);
  } catch (err) {
    console.warn("[shufersal] failed to parse PromoFull XML:", err);
    return promoByBarcode;
  }

  const promotions = toArray<any>(doc?.Root?.Promotions?.Promotion);

  for (const promo of promotions) {
    const groups = toArray<any>(promo?.Groups?.Group);
    for (const group of groups) {
      const promoItems = toArray<any>(group?.PromotionItems?.PromotionItem);
      for (const pi of promoItems) {
        const barcode = cleanString(pi?.ItemCode);
        const discounted = parseNumber(pi?.DiscountedPrice);

        if (!barcode || discounted === null || discounted <= 0) {
          // Skip malformed/zero-value promo rows (zero often means "free gift item",
          // not a usable shelf-price discount) — log for visibility.
          if (barcode && discounted === null) {
            console.warn("[shufersal] skipping malformed PromoFull item:", { ItemCode: pi?.ItemCode });
          }
          continue;
        }

        const existing = promoByBarcode.get(barcode);
        if (existing === undefined || discounted < existing) {
          promoByBarcode.set(barcode, discounted);
        }
      }
    }
  }

  return promoByBarcode;
}

async function ingest(): Promise<IngestResult> {
  const products: NormalizedProduct[] = [];
  const prices: NormalizedPrice[] = [];

  const priceFullUrl = await findLatestFileUrl("pricefull", STORE_ID);
  if (!priceFullUrl) {
    console.warn("[shufersal] no PriceFull file found — leaving previously ingested data untouched");
    return { products, prices };
  }

  const priceFullXml = await downloadAndGunzip(priceFullUrl);
  if (!priceFullXml) {
    console.warn("[shufersal] PriceFull download/decompress failed — leaving previously ingested data untouched");
    return { products, prices };
  }

  const parsedItems = parsePriceFullXml(priceFullXml);
  if (parsedItems.length === 0) {
    console.warn("[shufersal] PriceFull parsed to zero usable items — possible format change; aborting ingest");
    return { products, prices };
  }

  // Promo data is best-effort: if it fails, we still ingest plain prices.
  let promoByBarcode = new Map<string, number>();
  const promoFullUrl = await findLatestFileUrl("promofull", STORE_ID);
  if (promoFullUrl) {
    const promoFullXml = await downloadAndGunzip(promoFullUrl);
    if (promoFullXml) {
      promoByBarcode = parsePromoFullXml(promoFullXml);
    } else {
      console.warn("[shufersal] PromoFull download/decompress failed — ingesting prices without promos");
    }
  } else {
    console.warn("[shufersal] no PromoFull file found — ingesting prices without promos");
  }

  // Stores feed is fetched mainly for verification / future multi-branch support; we
  // don't yet use its contents beyond confirming the representative branch exists.
  const storesUrl = await findLatestFileUrl("stores", null);
  if (!storesUrl) {
    console.warn("[shufersal] no Stores file found (non-fatal — continuing with hardcoded branch)");
  }

  const seenBarcodes = new Set<string>();

  for (const item of parsedItems) {
    if (!seenBarcodes.has(item.barcode)) {
      seenBarcodes.add(item.barcode);
      products.push({
        barcode: item.barcode,
        name: item.name,
        manufacturer: item.manufacturer,
        unit: item.unit,
        category: null,
      });
    }

    const promoPrice = promoByBarcode.get(item.barcode) ?? null;

    prices.push({
      barcode: item.barcode,
      chainSlug: "shufersal",
      storeBranch: STORE_BRANCH,
      price: item.price,
      promoPrice: promoPrice !== null && promoPrice < item.price ? promoPrice : null,
    });
  }

  return { products, prices };
}

export const shufersal: ChainAdapter = {
  slug: "shufersal",
  ingest,
};
