export type NormalizedProduct = {
  barcode: string;
  name: string;
  manufacturer?: string | null;
  unit?: string | null;
  category?: string | null;
};

export type NormalizedPrice = {
  barcode: string;
  chainSlug: string;
  storeBranch?: string | null;
  price: number;
  promoPrice?: number | null;
};

export type IngestResult = {
  products: NormalizedProduct[];
  prices: NormalizedPrice[];
};

/**
 * Each supermarket chain implements this. Built and maintained by the
 * `price-feed-ingestor` sub-agent: locate the official price-transparency
 * portal, download PriceFull/PromoFull, parse gz/XML, normalize by barcode.
 * See skill `price-feed-ingestion`. NEVER scrape supermarket HTML.
 */
export interface ChainAdapter {
  slug: string;
  ingest(): Promise<IngestResult>;
}
