import type { NormalizedPrice, NormalizedProduct } from "./types";
import { iterateRecords, isValidBarcode, readField, toNumber } from "./feed-parser";

export type ParsedCatalog = {
  products: NormalizedProduct[];
  pricesByBarcode: Map<string, number>;
  skipped: number;
};

/** Parses a PriceFull XML document into normalized products + base prices. */
export function parsePriceFull(xml: string, chainSlug: string): ParsedCatalog {
  const products: NormalizedProduct[] = [];
  const pricesByBarcode = new Map<string, number>();
  let skipped = 0;

  for (const block of iterateRecords(xml, "Item")) {
    const barcode = readField(block, "ItemCode");
    const price = toNumber(readField(block, "ItemPrice"));
    const name = readField(block, "ItemName") ?? readField(block, "ManufacturerItemDescription");

    if (!isValidBarcode(barcode) || price == null || price <= 0 || !name) {
      skipped += 1;
      continue;
    }

    const unitQty = readField(block, "UnitQty");
    const unitOfMeasure = readField(block, "UnitOfMeasure");
    const unit = [unitQty, unitOfMeasure].filter(Boolean).join(" ") || null;

    products.push({
      barcode,
      name: name.trim(),
      manufacturer: readField(block, "ManufacturerName")?.trim() ?? null,
      unit,
      category: null, // not present in PriceFull — left for future enrichment
    });
    pricesByBarcode.set(barcode, price);
  }

  if (skipped > 0) {
    console.warn(`[ingestion:${chainSlug}] PriceFull: skipped ${skipped} malformed item row(s).`);
  }

  return { products, pricesByBarcode, skipped };
}

/** Parses a PromoFull XML document into a barcode -> discounted-price map. */
export function parsePromoFull(xml: string, chainSlug: string): Map<string, number> {
  const promoByBarcode = new Map<string, number>();
  let skipped = 0;

  for (const block of iterateRecords(xml, "Promotion")) {
    const discounted = toNumber(readField(block, "DiscountedPrice"));
    if (discounted == null || discounted <= 0) {
      skipped += 1;
      continue;
    }
    // Promotions list affected items in a nested <PromotionItems><Item><ItemCode>
    for (const itemBlock of iterateRecords(block, "Item")) {
      const barcode = readField(itemBlock, "ItemCode");
      if (!isValidBarcode(barcode)) continue;
      const existing = promoByBarcode.get(barcode);
      if (existing == null || discounted < existing) {
        promoByBarcode.set(barcode, discounted);
      }
    }
  }

  if (skipped > 0) {
    console.warn(`[ingestion:${chainSlug}] PromoFull: skipped ${skipped} malformed promotion row(s).`);
  }

  return promoByBarcode;
}

/** Resolves a representative branch label out of a Stores feed (first store, or env override). */
export function resolveBranch(xml: string | null, overrideId?: string | null): string | null {
  if (overrideId) return overrideId;
  if (!xml) return null;
  for (const block of iterateRecords(xml, "Store")) {
    const storeId = readField(block, "StoreId");
    if (storeId) return storeId;
  }
  return null;
}

/** Merges base prices + promo prices into NormalizedPrice rows. */
export function buildPrices(
  chainSlug: string,
  storeBranch: string | null,
  pricesByBarcode: Map<string, number>,
  promoByBarcode: Map<string, number>
): NormalizedPrice[] {
  const rows: NormalizedPrice[] = [];
  for (const [barcode, price] of pricesByBarcode) {
    rows.push({
      barcode,
      chainSlug,
      storeBranch,
      price,
      promoPrice: promoByBarcode.get(barcode) ?? null,
    });
  }
  return rows;
}
