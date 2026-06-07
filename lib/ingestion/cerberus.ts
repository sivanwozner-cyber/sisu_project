/**
 * Shared client for the "Cerberus" price-transparency portal
 * (url.publishedprices.co.il) used by multiple chains, including Rami Levy,
 * Carrefour and Yochananof. Login is per-chain (username = chain code,
 * password often empty for the public read-only account) — exact values
 * MUST be supplied via env; never hardcoded (PRD §17 / secrets policy).
 */

export class PortalCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortalCredentialsError";
  }
}

const BASE_URL = process.env.CERBERUS_BASE_URL ?? "https://url.publishedprices.co.il";

export type CerberusFile = { name: string; size?: number };

async function cerberusLogin(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }).toString(),
    redirect: "manual",
  });
  const cookie = res.headers.get("set-cookie");
  if (!cookie || (res.status >= 400 && res.status < 600 && res.status !== 302)) {
    throw new Error(`Cerberus login failed for ${username}: HTTP ${res.status}`);
  }
  return cookie;
}

async function cerberusListFiles(cookie: string): Promise<CerberusFile[]> {
  const res = await fetch(`${BASE_URL}/file/json/dir`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`Cerberus file listing failed: HTTP ${res.status}`);
  const data = (await res.json()) as { name: string; size?: number }[];
  return data.map((f) => ({ name: f.name, size: f.size }));
}

async function cerberusDownload(cookie: string, filename: string): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/file/d/${encodeURIComponent(filename)}`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) throw new Error(`Cerberus download failed for ${filename}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Picks the most recent file matching a type prefix (PriceFull/PromoFull/Stores). */
function latestByPrefix(files: CerberusFile[], prefix: string): CerberusFile | null {
  const matches = files.filter((f) => f.name.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!matches.length) return null;
  // Filenames embed a timestamp suffix (...-YYYYMMDDHHmmss.gz) so lexicographic
  // sort on the name is equivalent to chronological sort.
  return matches.sort((a, b) => (a.name < b.name ? 1 : -1))[0];
}

export type CerberusFeedSet = {
  priceFull: Buffer | null;
  promoFull: Buffer | null;
  stores: Buffer | null;
};

/**
 * Logs in, lists files, and downloads the latest PriceFull/PromoFull/Stores.
 * Throws `PortalCredentialsError` if env credentials are missing so the caller
 * can log + degrade gracefully without writing/truncating anything.
 */
export async function fetchCerberusFeeds(opts: {
  usernameEnv: string;
  passwordEnv: string;
  pricePrefix?: string;
  promoPrefix?: string;
  storesPrefix?: string;
}): Promise<CerberusFeedSet> {
  const username = process.env[opts.usernameEnv];
  const password = process.env[opts.passwordEnv];
  if (!username) {
    throw new PortalCredentialsError(
      `Missing ${opts.usernameEnv} (and likely ${opts.passwordEnv}) — cannot log in to Cerberus portal at ${BASE_URL}.`
    );
  }

  const cookie = await cerberusLogin(username, password ?? "");
  const files = await cerberusListFiles(cookie);

  const priceFile = latestByPrefix(files, opts.pricePrefix ?? "PriceFull");
  const promoFile = latestByPrefix(files, opts.promoPrefix ?? "PromoFull");
  const storesFile = latestByPrefix(files, opts.storesPrefix ?? "Stores");

  const [priceFull, promoFull, stores] = await Promise.all([
    priceFile ? cerberusDownload(cookie, priceFile.name) : Promise.resolve(null),
    promoFile ? cerberusDownload(cookie, promoFile.name) : Promise.resolve(null),
    storesFile ? cerberusDownload(cookie, storesFile.name) : Promise.resolve(null),
  ]);

  return { priceFull, promoFull, stores };
}
