import { prisma } from "@/lib/prisma";

export type PriceItem = {
  store: string;
  store_logo_url: string | null;
  product_name: string;
  barcode: string | null;
  price: number;
  unit: string | null;
  is_lowest: boolean;
  updated_at: string;
};

export type PriceGroup = {
  manufacturer: string | null;
  items: PriceItem[];
};

/**
 * Searches the ingested catalog. Identity is barcode-first; results are grouped
 * by manufacturer for display, sorted cheapest→most expensive within a group,
 * with the cheapest item flagged is_lowest (PRD §7.1).
 */
export async function searchPrices(
  query: string,
  category?: string | null,
): Promise<PriceGroup[]> {
  const q = query.trim();

  const products = await prisma.product.findMany({
    where: {
      AND: [
        category ? { category } : {},
        { OR: [{ name: { contains: q, mode: "insensitive" } }, { barcode: q }] },
      ],
    },
    include: { prices: { orderBy: { ingestedAt: "desc" } } },
    take: 100,
  });

  const stores = await prisma.store.findMany({
    select: { slug: true, logoUrl: true },
  });
  const logoBySlug = new Map(stores.map((s) => [s.slug, s.logoUrl]));

  type Tmp = PriceItem & { manufacturer: string | null };
  const items: Tmp[] = [];

  for (const p of products) {
    // Latest price per chain (prices are ordered desc by ingestedAt).
    const latestByChain = new Map<string, (typeof p.prices)[number]>();
    for (const pr of p.prices) {
      if (!latestByChain.has(pr.chainSlug)) latestByChain.set(pr.chainSlug, pr);
    }
    for (const pr of latestByChain.values()) {
      const effective = pr.promoPrice ?? pr.price;
      items.push({
        manufacturer: p.manufacturer,
        store: pr.chainSlug,
        store_logo_url: logoBySlug.get(pr.chainSlug) ?? null,
        product_name: p.name,
        barcode: p.barcode,
        price: Number(effective),
        unit: p.unit,
        is_lowest: false,
        updated_at: pr.ingestedAt.toISOString(),
      });
    }
  }

  const groupsMap = new Map<string | null, Tmp[]>();
  for (const it of items) {
    const arr = groupsMap.get(it.manufacturer);
    if (arr) arr.push(it);
    else groupsMap.set(it.manufacturer, [it]);
  }

  const groups: PriceGroup[] = [];
  for (const [manufacturer, groupItems] of groupsMap) {
    groupItems.sort((a, b) => a.price - b.price);
    if (groupItems.length) groupItems[0].is_lowest = true;
    groups.push({
      manufacturer,
      items: groupItems.map(({ manufacturer: _m, ...rest }) => rest),
    });
  }

  groups.sort((a, b) =>
    (a.manufacturer ?? "￿").localeCompare(b.manufacturer ?? "￿", "he"),
  );
  return groups;
}
