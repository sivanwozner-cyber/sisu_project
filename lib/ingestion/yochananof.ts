import type { ChainAdapter, IngestResult } from "./types";
import { fetchCerberusFeeds, PortalCredentialsError } from "./cerberus";
import { decompressFeed } from "./feed-parser";
import { buildPrices, parsePriceFull, parsePromoFull, resolveBranch } from "./normalize";

const SLUG = "yochananof";

export const yochananof: ChainAdapter = {
  slug: SLUG,
  async ingest(): Promise<IngestResult> {
    try {
      const feeds = await fetchCerberusFeeds({
        usernameEnv: "YOCHANANOF_USERNAME",
        passwordEnv: "YOCHANANOF_PASSWORD",
      });

      if (!feeds.priceFull) {
        console.warn(`[ingestion:${SLUG}] No PriceFull file found on portal — keeping last known data.`);
        return { products: [], prices: [] };
      }

      const branch = resolveBranch(
        feeds.stores ? decompressFeed(feeds.stores) : null,
        process.env.YOCHANANOF_BRANCH_ID
      );

      const { products, pricesByBarcode } = parsePriceFull(decompressFeed(feeds.priceFull), SLUG);
      const promoByBarcode = feeds.promoFull
        ? parsePromoFull(decompressFeed(feeds.promoFull), SLUG)
        : new Map<string, number>();

      return { products, prices: buildPrices(SLUG, branch, pricesByBarcode, promoByBarcode) };
    } catch (err) {
      if (err instanceof PortalCredentialsError) {
        console.warn(`[ingestion:${SLUG}] ${err.message} Skipping ingest; existing data left intact.`);
      } else {
        console.error(`[ingestion:${SLUG}] ingest failed:`, err);
      }
      return { products: [], prices: [] };
    }
  },
};
