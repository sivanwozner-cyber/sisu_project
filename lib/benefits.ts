import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/haversine";
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

/** Benefits for a store, filtered to public + the given club memberships. */
export async function getStoreBenefits(storeSlug: string, clubs: string[]) {
  const since = new Date(Date.now() - SIX_HOURS_MS);
  const rows = await prisma.benefitCache.findMany({
    where: { storeSlug, scrapedAt: { gte: since } },
    orderBy: { scrapedAt: "desc" },
  });
  // NOTE: on a cache miss we would fetch via BrightData here (per club's
  // scrape_targets). That path is pending integration; cold misses currently
  // return whatever is cached.
  const benefits = rows
    .map(serialize)
    .filter((b) => b.is_public || (b.club_id != null && clubs.includes(b.club_id)));
  return { benefits, cacheHit: rows.length > 0, sourcesFailed: [] as string[] };
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
  const rows = await prisma.benefitCache.findMany({
    where: { mallSlug: { in: mallSlugs }, scrapedAt: { gte: since } },
    orderBy: { validFrom: "asc" },
  });
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
  return { benefits, upcoming_count: upcomingCount };
}

/** Birthday benefits catalog (cached up to 7 days). */
export async function getBirthdayBenefits(): Promise<Benefit[]> {
  const since = new Date(Date.now() - SEVEN_DAYS_MS);
  const rows = await prisma.benefitCache.findMany({
    where: { type: "birthday", scrapedAt: { gte: since } },
    orderBy: { scrapedAt: "desc" },
  });
  return rows.map(serialize);
}
