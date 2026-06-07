import type { ChainAdapter } from "./types";
import { shufersal } from "./shufersal";
import { ramiLevy } from "./rami-levy";
import { carrefour } from "./carrefour";
import { yochananof } from "./yochananof";

/**
 * Registry of per-chain adapters. Each adapter locates its official
 * price-transparency portal, downloads PriceFull/PromoFull/Stores, and
 * normalizes by ItemCode -> barcode. See skill `price-feed-ingestion`.
 *
 * Portal credentials are read from env (see lib/ingestion/cerberus.ts and
 * lib/ingestion/shufersal.ts for the exact variable names). When credentials
 * are missing, an adapter logs a warning and returns an empty result —
 * upsertIngest treats that as a no-op, so existing data is never truncated.
 */
export const adapters: ChainAdapter[] = [shufersal, ramiLevy, carrefour, yochananof];
