export class BrightDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrightDataError";
  }
}

// BrightData Web Unlocker REST endpoint. Overridable for self-hosted / future
// API changes. The zone is the BrightData "zone" provisioned for benefits
// scraping (server-side only — never for supermarket prices).
const BRIGHTDATA_API_URL =
  process.env.BRIGHTDATA_API_URL ?? "https://api.brightdata.com/request";

/**
 * Server-side fetch of a page rendered as Markdown via BrightData (benefits only
 * — never for supermarket prices, which come from official feeds).
 *
 * Uses the Web Unlocker `/request` API with `data_format: "markdown"`, which
 * returns the page already converted to Markdown — the input the deterministic
 * parser (and the LLM fallback) expect. Requires `BRIGHTDATA_API_TOKEN` and
 * `BRIGHTDATA_ZONE`; when unset, throws BrightDataError so callers treat the
 * source as failed (partial results / yellow banner) rather than crashing.
 */
export async function fetchMarkdown(url: string): Promise<string> {
  const token = process.env.BRIGHTDATA_API_TOKEN;
  const zone = process.env.BRIGHTDATA_ZONE;
  if (!token) {
    throw new BrightDataError("BRIGHTDATA_API_TOKEN is not configured");
  }
  if (!zone) {
    throw new BrightDataError("BRIGHTDATA_ZONE is not configured");
  }

  let res: Response;
  try {
    res = await fetch(BRIGHTDATA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        zone,
        url,
        format: "raw",
        data_format: "markdown",
      }),
    });
  } catch (e) {
    throw new BrightDataError(
      `BrightData request failed for ${url}: ${(e as Error).message}`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new BrightDataError(
      `BrightData returned ${res.status} for ${url}: ${detail.slice(0, 200)}`,
    );
  }

  const text = await res.text();
  if (!text.trim()) {
    throw new BrightDataError(`BrightData returned empty content for ${url}`);
  }
  return text;
}
