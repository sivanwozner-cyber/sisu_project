/**
 * DEV-ONLY demo mode. Lets the whole app be navigated without a live database
 * or Google OAuth, so the UX flow can be reviewed visually. Gated on
 * NEXT_PUBLIC_DEMO=1 AND a non-production build — it can never activate in prod.
 *
 * It does NOT weaken the security model: the demo user id is a server-side
 * constant (never taken from the request body), and every API route still runs
 * its normal auth check first. Demo only short-circuits the DB calls.
 */
export const IS_DEMO =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEMO === "1";

export const DEMO_USER = {
  id: "demo-user",
  name: "אורח/ת דמו",
  email: "demo@example.com",
  profileComplete: true,
};

const STORE_LOGOS: Record<string, string | null> = {
  shufersal: null,
  "rami-levy": null,
  carrefour: null,
  yochananof: null,
};

// Relative date → ISO yyyy-mm-dd (benefits use a date string for valid_to).
function day(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const NOW = new Date().toISOString();

// --- Prices --------------------------------------------------------------
type DemoProduct = {
  barcode: string;
  name: string;
  manufacturer: string;
  unit: string;
  prices: { store: string; price: number; promo?: number }[];
};

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    barcode: "7290000066318",
    name: "חלב תנובה 3% 1 ליטר",
    manufacturer: "תנובה",
    unit: "1 ליטר",
    prices: [
      { store: "shufersal", price: 6.9 },
      { store: "rami-levy", price: 5.9 },
      { store: "yochananof", price: 6.5 },
    ],
  },
  {
    barcode: "7290004131074",
    name: "קוטג' תנובה 5%",
    manufacturer: "תנובה",
    unit: "250 גרם",
    prices: [
      { store: "shufersal", price: 7.5 },
      { store: "rami-levy", price: 6.9, promo: 5.9 },
    ],
  },
  {
    barcode: "7290000041247",
    name: "במבה אוסם",
    manufacturer: "אוסם",
    unit: "80 גרם",
    prices: [
      { store: "carrefour", price: 4.2 },
      { store: "rami-levy", price: 3.9 },
    ],
  },
];

export type DemoPriceItem = {
  store: string;
  store_logo_url: string | null;
  product_name: string;
  barcode: string | null;
  price: number;
  unit: string | null;
  is_lowest: boolean;
  updated_at: string;
};
export type DemoPriceGroup = {
  manufacturer: string | null;
  items: DemoPriceItem[];
};

export function demoSearchPrices(query: string): DemoPriceGroup[] {
  const q = query.trim().toLowerCase();
  const matched = DEMO_PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.barcode === q,
  );

  const byManufacturer = new Map<string | null, DemoPriceItem[]>();
  for (const p of matched) {
    for (const pr of p.prices) {
      const item: DemoPriceItem = {
        store: pr.store,
        store_logo_url: STORE_LOGOS[pr.store] ?? null,
        product_name: p.name,
        barcode: p.barcode,
        price: pr.promo ?? pr.price,
        unit: p.unit,
        is_lowest: false,
        updated_at: NOW,
      };
      const arr = byManufacturer.get(p.manufacturer);
      if (arr) arr.push(item);
      else byManufacturer.set(p.manufacturer, [item]);
    }
  }

  const groups: DemoPriceGroup[] = [];
  for (const [manufacturer, items] of byManufacturer) {
    items.sort((a, b) => a.price - b.price);
    if (items.length) items[0].is_lowest = true;
    groups.push({ manufacturer, items });
  }
  groups.sort((a, b) =>
    (a.manufacturer ?? "￿").localeCompare(b.manufacturer ?? "￿", "he"),
  );
  return groups;
}

// --- Benefits ------------------------------------------------------------
export type DemoBenefit = {
  id: string;
  description: string;
  type: "discount" | "cashback" | "gift" | "birthday";
  discount_pct: number | null;
  discount_amount: number | null;
  valid_from: string | null;
  valid_to: string | null;
  club_id: string | null;
  is_public: boolean;
  is_expired: boolean;
  club_app_url: string | null;
  source_url: string;
  image_url: string | null;
  store_slug: string | null;
  scraped_at: string;
};

function benefit(b: Partial<DemoBenefit> & { id: string; description: string; type: DemoBenefit["type"] }): DemoBenefit {
  return {
    discount_pct: null,
    discount_amount: null,
    valid_from: null,
    valid_to: null,
    club_id: null,
    is_public: true,
    is_expired: false,
    club_app_url: null,
    source_url: "https://example.com",
    image_url: null,
    store_slug: null,
    scraped_at: NOW,
    ...b,
  };
}

const STORE_BENEFITS: Record<string, DemoBenefit[]> = {
  shufersal: [
    benefit({
      id: "s1",
      description: "20% הנחה על קנייה מעל ₪200 במחלקת הפירות והירקות",
      type: "discount",
      discount_pct: 20,
      valid_to: day(21),
      store_slug: "shufersal",
      source_url: "https://www.shufersal.co.il/online/he/promotions",
    }),
    benefit({
      id: "s2",
      description: "קאשבק ₪30 בתשלום עם כרטיס כאל בשופרסל",
      type: "cashback",
      discount_amount: 30,
      valid_to: day(45),
      is_public: false,
      club_id: "cal",
      club_app_url: "https://www.cal-online.co.il/",
      store_slug: "shufersal",
      source_url: "https://www.shufersal.co.il/online/he/promotions",
    }),
  ],
  "rami-levy": [
    benefit({
      id: "r1",
      description: "1+1 על מוצרי החלב של תנובה",
      type: "gift",
      valid_to: day(7),
      store_slug: "rami-levy",
      source_url: "https://www.rami-levy.co.il/he/online/sales",
    }),
    benefit({
      id: "r2",
      description: "מבצע שהסתיים — 15% על מאפים",
      type: "discount",
      discount_pct: 15,
      valid_to: day(-3),
      is_expired: true,
      store_slug: "rami-levy",
      source_url: "https://www.rami-levy.co.il/he/online/sales",
    }),
  ],
  carrefour: [
    benefit({
      id: "c1",
      description: "10% הנחה במותג הפרטי של קרפור",
      type: "discount",
      discount_pct: 10,
      valid_to: day(14),
      store_slug: "carrefour",
      source_url: "https://www.carrefour.co.il/",
    }),
  ],
  yochananof: [
    benefit({
      id: "y1",
      description: "מתנה: שמן זית בקנייה מעל ₪150",
      type: "gift",
      valid_to: day(30),
      store_slug: "yochananof",
      source_url: "https://www.yochananof.co.il/",
    }),
  ],
};

export function demoStoreBenefits(
  storeSlug: string,
  clubs: string[],
): DemoBenefit[] {
  const all = STORE_BENEFITS[storeSlug] ?? [];
  // Public benefits always show; club-restricted ones only if the user holds the club.
  return all.filter((b) => b.is_public || (b.club_id && clubs.includes(b.club_id)));
}

const MALLS = [
  { slug: "azrieli", name: "קניון עזריאלי", lat: 32.0735, lng: 34.7925 },
  { slug: "ramat-aviv", name: "קניון רמת אביב", lat: 32.1133, lng: 34.8029 },
];

const MALL_BENEFITS: Record<string, DemoBenefit[]> = {
  azrieli: [
    benefit({
      id: "m1",
      description: "10% הנחה ברשתות האופנה בהצגת אפליקציית עזריאלי",
      type: "discount",
      discount_pct: 10,
      valid_to: day(60),
      source_url: "https://www.azrielimalls.co.il/malls/tel-aviv/coupons",
    }),
    benefit({
      id: "m2",
      description: "כניסה חינם לחניון בסופי שבוע (מבצע עתידי)",
      type: "gift",
      valid_from: day(10),
      valid_to: day(40),
      source_url: "https://www.azrielimalls.co.il/malls/tel-aviv/coupons",
    }),
  ],
  "ramat-aviv": [
    benefit({
      id: "m3",
      description: "מתנה בשווי ₪50 בקנייה מעל ₪400",
      type: "gift",
      discount_amount: 50,
      valid_to: day(30),
      source_url: "https://www.ramat-aviv-mall.co.il/benefits",
    }),
  ],
};

export function demoMatchMalls(manual: string | null) {
  if (manual) {
    const q = manual.trim();
    const hit = MALLS.filter((m) => m.name.includes(q) || q.includes(m.name));
    return (hit.length ? hit : MALLS).map((m) => ({
      slug: m.slug,
      name: m.name,
      distance_km: null as number | null,
    }));
  }
  // Geolocation path: just return the nearest two as a demo.
  return MALLS.map((m) => ({ slug: m.slug, name: m.name, distance_km: 1.2 }));
}

export function demoNearbyBenefits(
  mallSlugs: string[],
  includeUpcoming: boolean,
): DemoBenefit[] {
  const out: DemoBenefit[] = [];
  for (const slug of mallSlugs) out.push(...(MALL_BENEFITS[slug] ?? []));
  return out.filter((b) => includeUpcoming || !b.valid_from || b.valid_from <= day(0));
}

const BIRTHDAY_BENEFITS: DemoBenefit[] = [
  benefit({
    id: "b1",
    description: "הטבת יום הולדת: ₪50 מתנה לחברי מועדון כאל",
    type: "birthday",
    discount_amount: 50,
    is_public: false,
    club_id: "cal",
    club_app_url: "https://www.cal-online.co.il/",
    source_url: "https://www.cal-online.co.il/benefits",
  }),
  benefit({
    id: "b2",
    description: "הטבת יום הולדת: 25% הנחה ברשתות נבחרות עם max",
    type: "birthday",
    discount_pct: 25,
    is_public: false,
    club_id: "leumi-card",
    club_app_url: "https://www.max.co.il/",
    source_url: "https://www.max.co.il/benefits",
  }),
];

export function demoBirthdayBenefits(): DemoBenefit[] {
  return BIRTHDAY_BENEFITS;
}

// --- Profile (in-memory; resets when the dev server restarts) -------------
export const demoProfile: {
  birthdate: string | null;
  clubs: string[];
} = {
  birthdate: "1990-05-14",
  clubs: ["cal"],
};
