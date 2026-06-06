export class BrightDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrightDataError";
  }
}

/**
 * Server-side fetch of a page's content via BrightData (benefits only — never
 * for supermarket prices, which come from official feeds).
 *
 * The concrete BrightData endpoint is wired during integration, alongside
 * scrape_targets discovery (see agent `scrape-target-builder`). Until then this
 * throws BrightDataError, which callers treat as a failed source (partial results).
 */
export async function fetchMarkdown(url: string): Promise<string> {
  const token = process.env.BRIGHTDATA_API_TOKEN;
  if (!token) {
    throw new BrightDataError("BRIGHTDATA_API_TOKEN is not configured");
  }
  throw new BrightDataError(
    `BrightData fetch not yet wired for ${url} (pending integration)`,
  );
}
