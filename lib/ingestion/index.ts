import type { ChainAdapter } from "./types";
import { shufersal } from "./shufersal";

/**
 * Registry of per-chain adapters. Populated by the `price-feed-ingestor`
 * sub-agent once each chain's portal URL + credentials are confirmed
 * (see PRD §17 — currently deferred by the product owner).
 *
 * Example (once an adapter exists):
 *   import { ramiLevy } from "./rami-levy";
 *   export const adapters: ChainAdapter[] = [ramiLevy];
 */
export const adapters: ChainAdapter[] = [shufersal];
