import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/haversine";
import { fetchMarkdown } from "@/lib/brightdata";
import {
  extractBenefits,
  type BenefitScrapeTargets,
  type ParsedBenefit,
} from "@/lib/benefits-parse";
import type { Benefit } from "@/components/benefit-card";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NEARBY_RADIUS_KM = 2;

type BenefitRow = Awaited<
  ReturnType<typeof prisma.benefitCache.findMany>
>[number];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function serialize(row: BenefitRow): Benefit {
  const today = startOfToday();
  const isExpired = row.validTo ? new Date(row.validTo) < today : false;
  return {
    id: row.id,
    description: row.description,
    type: row.type,
    discount_pct: row.discountPct != null ? Number(row.discountPct) : null,
    discount_amount:
      row.discountAmount != null ? Number(row.discountAmount) : null,
    valid_from: row.validFrom ? row.validFrom.toISOString().slice(0, 10) : null,
    valid_to: row.validTo ? row.validTo.toISOString().slice(0, 10) : null,
    club_id: row.clubId,
    is_public: row.isPublic,
    is_expired: isExpired,
    club_app_url: row.clubAppUrl,
    source_url: row.sourceUrl,
    image_url: row.imageUrl,
    store_slug: row.storeSlug,
    scraped_at: row.scrapedAt.toISOString(),
  };
}

// ---- Cache-miss fetch path (BrightData → deterministic parse → LLM fallback) ----

type CacheKey = {
  storeSlug?: string | null;
  mallSlug?: string | null;
  clubId?: string | null;
};

function toRow(b: ParsedBenefit, key: CacheKey, clubAppUrl: string | null) {
  return {
    storeSlug: key.storeSlug ?? null,
    mallSlug: key.mallSlug ?? null,
    clubId: b.club_id ?? key.clubId ?? null,
    description: b.description,
    type: b.type,
    discountPct: b.discount_pct,
    discountAmount: b.discount_amount,
    validFrom: b.valid_from ? new Date(b.valid_from) : null,
    validTo: b.valid_to ? new Date(b.valid_to) : null,
    isPublic: b.is_public,
    clubAppUrl,
    sourceUrl: b.source_url,
    imageUrl: b.image_url,
  };
}

/**
 * Fetch + extract all benefit pages declared in a source's scrape_targets.
 * Returns the parsed benefits plus the URLs that failed (so callers can report
 * partial results). Never throws: a failed source degrades to partial output.
 */
async function fetchSource(
  targets: BenefitScrapeTargets | null,
): Promise<{ benefits: ParsedBenefit[]; failed: string[] }> {
  const conf = targets?.benefits;
  if (!conf?.urls?.length) return { benefits: [], failed: [] };

  const benefits: ParsedBenefit[] = [];
  const failed: string[] = [];
  for (const url of conf.urls) {
    try {
      const markdown = await fetchMarkdown(url);
      benefits.push(...(await extractBenefits(markdown, conf, url)));
    } catch (e) {
      console.warn(`benefit source failed (${url}): ${(e as Error).message}`);
      failed.push(url);
    }
  }
  return { benefits, failed };
}

function asTargets(value: unknown): BenefitScrapeTargets | null {
  return (value as BenefitScrapeTargets | null) ?? null;
}

/** On a store cache miss: scrape its targets, replace its cached rows. */
async function refreshStoreBenefits(storeSlug: string): Promise<string[]> {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  const { benefits, failed } = await fetchSource(asTargets(store?.scrapeTargets));
  if (benefits.length) {
    await prisma.$transaction([
      prisma.benefitCache.deleteMany({ where: { storeSlug } }),
      prisma.benefitCache.createMany({
        data: benefits.map((b) => toRow(b, { storeSlug }, null)),
      }),
    ]);
  }
  return failed;
}

/** On a mall cache miss: scrape its targets, replace its cached rows. */
async function refreshMallBenefits(mallSlug: string): Promise<string[]> {
  const mall = await prisma.mall.findUnique({ where: { slug: mallSlug } });
  const { benefits, failed } = await fetchSource(asTargets(mall?.scrapeTargets));
  if (benefits.length) {
    await prisma.$transaction([
      prisma.benefitCache.deleteMany({ where: { mallSlug } }),
      prisma.benefitCache.createMany({
        data: benefits.map((b) => toRow(b, { mallSlug }, null)),
      }),
    ]);
  }
  return failed;
}

/** On a birthday cache miss: scrape every club whose targets yield birthday benefits. */
async function refreshBirthdayBenefits(): Promise<string[]> {
  const clubs = await prisma.club.findMany();
  const rows: ReturnType<typeof toRow>[] = [];
  const failed: string[] = [];
  for (const club of clubs) {
    const targets = asTargets(club.scrapeTargets);
    if (targets?.benefits?.defaults?.type !== "birthday") continue;
    const res = await fetchSource(targets);
    failed.push(...res.failed);
    rows.push(
      ...res.benefits.map((b) =>
        toRow(b, { clubId: club.slug }, club.appUrl ?? null),
      ),
    );
  }
  if (rows.length) {
    await prisma.$transaction([
      prisma.benefitCache.deleteMany({ where: { type: "birthday" } }),
      prisma.benefitCache.createMany({ data: rows }),
    ]);
  }
  return failed;
}

// ---- Public read API (cache-first, fetch on miss) ----

/** Benefits for a store, filtered to public + the given club memberships. */
export async function getStoreBenefits(storeSlug: string, clubs: string[]) {
  const since = new Date(Date.now() - SIX_HOURS_MS);
  const query = {
    where: { storeSlug, scrapedAt: { gte: since } },
    orderBy: { scrapedAt: "desc" },
  } as const;

  let rows = await prisma.benefitCache.findMany(query);
  const cacheHit = rows.length > 0;
  let sourcesFailed: string[] = [];
  if (!cacheHit) {
    sourcesFailed = await refreshStoreBenefits(storeSlug);
    rows = await prisma.benefitCache.findMany(query);
  }

  const benefits = rows
    .map(serialize)
    .filter(
      (b) => b.is_public || (b.club_id != null && clubs.includes(b.club_id)),
    );
  return { benefits, cacheHit, sourcesFailed };
}

export type MatchedMall = {
  slug: string;
  name: string;
  distance_km: number | null;
};

export async function matchMalls(
  lat: number | null,
  lng: number | null,
  manual: string | null,
): Promise<MatchedMall[]> {
  const malls = await prisma.mall.findMany();
  if (lat != null && lng != null) {
    return malls
      .map((m) => ({
        slug: m.slug,
        name: m.name,
        distance_km: haversineKm(lat, lng, m.lat, m.lng),
      }))
      .filter((m) => (m.distance_km as number) <= NEARBY_RADIUS_KM)
      .sort((a, b) => (a.distance_km as number) - (b.distance_km as number));
  }
  if (manual && manual.trim()) {
    const q = manual.trim();
    return malls
      .filter((m) => m.name.includes(q) || m.slug === q)
      .map((m) => ({ slug: m.slug, name: m.name, distance_km: null }));
  }
  return [];
}

export async function getNearbyBenefits(
  mallSlugs: string[],
  includeUpcoming: boolean,
) {
  const since = new Date(Date.now() - SIX_HOURS_MS);
  const query = {
    where: { mallSlug: { in: mallSlugs }, scrapedAt: { gte: since } },
    orderBy: { validFrom: "asc" },
  } as const;

  let rows = await prisma.benefitCache.findMany(query);
  const sourcesFailed: string[] = [];
  const fresh = new Set(rows.map((r) => r.mallSlug));
  const missing = mallSlugs.filter((s) => !fresh.has(s));
  if (missing.length) {
    for (const slug of missing) {
      sourcesFailed.push(...(await refreshMallBenefits(slug)));
    }
    rows = await prisma.benefitCache.findMany(query);
  }

  const today = startOfToday();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);

  let upcomingCount = 0;
  const benefits = rows.map(serialize).filter((b) => {
    const from = b.valid_from ? new Date(b.valid_from) : null;
    const to = b.valid_to ? new Date(b.valid_to) : null;
    const activeToday = (!from || from <= today) && (!to || to >= today);
    const upcoming = !!from && from > today && from <= horizon;
    if (upcoming) upcomingCount += 1;
    return includeUpcoming ? activeToday || upcoming : activeToday;
  });
  return { benefits, upcoming_count: upcomingCount, sources_failed: sourcesFailed };
}

/** Birthday benefits catalog (cached up to 7 days). */
export async function getBirthdayBenefits(): Promise<{
  benefits: Benefit[];
  sources_failed: string[];
}> {
  const since = new Date(Date.now() - SEVEN_DAYS_MS);
  const query = {
    where: { type: "birthday" as const, scrapedAt: { gte: since } },
    orderBy: { scrapedAt: "desc" },
  } as const;

  let rows = await prisma.benefitCache.findMany(query);
  let sourcesFailed: string[] = [];
  if (rows.length === 0) {
    sourcesFailed = await refreshBirthdayBenefits();
    rows = await prisma.benefitCache.findMany(query);
  }
  return { benefits: rows.map(serialize), sources_failed: sourcesFailed };
}
