import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // scrape_targets shape is consumed by lib/benefits-parse.ts (regex over the
  // markdown BrightData returns). Real selectors/URLs are discovered & refined
  // by the `scrape-target-builder` agent — see lib/benefits/scrape-targets.sample.json.
  // These are illustrative defaults; the cache-miss path only hits them once
  // seeded benefit_cache rows age past their TTL.
  const birthdayTargets = (url: string, club: string) => ({
    benefits: {
      urls: [url],
      tool: "scrape_as_markdown",
      defaults: { type: "birthday", is_public: false, club_id: club },
    },
  });

  await prisma.club.createMany({
    data: [
      {
        slug: "cal",
        name: "כאל",
        appUrl: "https://www.cal-online.co.il/",
        scrapeTargets: birthdayTargets("https://www.cal-online.co.il/benefits", "cal"),
      },
      {
        slug: "leumi-card",
        name: "לאומי קארד",
        appUrl: "https://www.max.co.il/",
        scrapeTargets: birthdayTargets("https://www.max.co.il/benefits", "leumi-card"),
      },
      { slug: "moadon-haverim", name: "מועדון חברים", appUrl: "https://www.moadon-haverim.co.il/" },
      { slug: "jurocum", name: "יורוקום", appUrl: "https://www.jurocum.co.il/" },
    ],
    skipDuplicates: true,
  });

  await prisma.store.createMany({
    data: [
      {
        slug: "shufersal",
        name: "שופרסל",
        scrapeTargets: {
          benefits: {
            urls: ["https://www.shufersal.co.il/online/he/promotions"],
            tool: "scrape_as_markdown",
            defaults: { type: "discount", is_public: true, club_id: null },
          },
        },
      },
      { slug: "rami-levy", name: "רמי לוי" },
      { slug: "carrefour", name: "קרפור" },
      { slug: "yochananof", name: "יוחננוף" },
    ],
    skipDuplicates: true,
  });

  await prisma.mall.createMany({
    data: [
      {
        slug: "azrieli",
        name: "קניון עזריאלי",
        lat: 32.0735,
        lng: 34.7925,
        // Real config discovered & verified live by `scrape-target-builder`
        // (see lib/benefits/scrape-targets.sample.json + .README.md). discount_amount
        // captures "ב-{sale} במקום {original}" — the parser computes original − sale.
        scrapeTargets: {
          benefits: {
            urls: [
              "https://www.azrielimalls.co.il/malls/tel-aviv/coupons",
              "https://www.azrielimalls.co.il/malls/jerusalem/coupons",
              "https://www.azrielimalls.co.il/malls/haifa/coupons",
            ],
            tool: "scrape_as_markdown",
            blockSplit:
              "(?=^###\\s+.+ב-[\\d.,]+\\s*₪\\s*במקום\\s*[\\d.,]+\\s*₪)",
            fields: {
              description:
                "^###\\s+(.+?)\\s+ב-[\\d.,]+\\s*₪\\s*במקום\\s*[\\d.,]+\\s*₪",
              discount_amount:
                "ב-([\\d.,]+)\\s*₪\\s*במקום\\s*([\\d.,]+)\\s*₪",
              valid_to: "בתוקף עד:\\s*(\\d{1,2}\\.\\d{1,2}\\.\\d{2,4})",
            },
            defaults: { type: "discount", is_public: true, club_id: null },
          },
        },
      },
      { slug: "ramat-aviv", name: "קניון רמת אביב", lat: 32.1133, lng: 34.8029 },
    ],
    skipDuplicates: true,
  });

  // --- DEV-ONLY sample price data. Replace with real ingestion (price-feed-ingestor). ---
  const sampleProducts = [
    { barcode: "7290000066318", name: "חלב תנובה 3% 1 ליטר", manufacturer: "תנובה", unit: "1 ליטר", category: "מוצרי חלב" },
    { barcode: "7290004131074", name: "קוטג' תנובה 5%", manufacturer: "תנובה", unit: "250 גרם", category: "מוצרי חלב" },
    { barcode: "7290000041247", name: "במבה אוסם", manufacturer: "אוסם", unit: "80 גרם", category: "חטיפים" },
  ];
  for (const p of sampleProducts) {
    await prisma.product.upsert({ where: { barcode: p.barcode }, update: p, create: p });
  }
  await prisma.price.deleteMany({
    where: { barcode: { in: sampleProducts.map((p) => p.barcode) } },
  });
  await prisma.price.createMany({
    data: [
      { barcode: "7290000066318", chainSlug: "shufersal", price: 6.9 },
      { barcode: "7290000066318", chainSlug: "rami-levy", price: 5.9 },
      { barcode: "7290000066318", chainSlug: "yochananof", price: 6.5 },
      { barcode: "7290004131074", chainSlug: "shufersal", price: 7.5 },
      { barcode: "7290004131074", chainSlug: "rami-levy", price: 6.9, promoPrice: 5.9 },
      { barcode: "7290000041247", chainSlug: "carrefour", price: 4.2 },
      { barcode: "7290000041247", chainSlug: "rami-levy", price: 3.9 },
    ],
  });

  // --- DEV-ONLY sample benefit cache. Real rows come from the BrightData
  // cache-miss path (lib/benefits.ts). scrapedAt defaults to now() so these are
  // fresh and served as cache hits by /benefits, /nearby, /birthday. ---
  const day = (offset: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  };

  await prisma.benefitCache.deleteMany({});
  await prisma.benefitCache.createMany({
    data: [
      // Store benefits (shufersal / rami-levy)
      {
        storeSlug: "shufersal",
        description: "20% הנחה על קנייה מעל ₪200 במחלקת הפירות והירקות",
        type: "discount",
        discountPct: 20,
        validTo: day(21),
        isPublic: true,
        sourceUrl: "https://www.shufersal.co.il/online/he/promotions",
      },
      {
        storeSlug: "shufersal",
        clubId: "cal",
        description: "קאשבק ₪30 בתשלום עם כרטיס כאל בשופרסל",
        type: "cashback",
        discountAmount: 30,
        validTo: day(45),
        isPublic: false,
        clubAppUrl: "https://www.cal-online.co.il/",
        sourceUrl: "https://www.shufersal.co.il/online/he/promotions",
      },
      {
        storeSlug: "rami-levy",
        description: "1+1 על מוצרי החלב של תנובה",
        type: "gift",
        validTo: day(7),
        isPublic: true,
        sourceUrl: "https://www.rami-levy.co.il/he/online/sales",
      },
      {
        storeSlug: "rami-levy",
        description: "מבצע שהסתיים — 15% על מאפים",
        type: "discount",
        discountPct: 15,
        validTo: day(-3),
        isPublic: true,
        sourceUrl: "https://www.rami-levy.co.il/he/online/sales",
      },
      // Mall benefits (azrieli / ramat-aviv)
      {
        mallSlug: "azrieli",
        description: "10% הנחה ברשתות האופנה בהצגת אפליקציית עזריאלי",
        type: "discount",
        discountPct: 10,
        validTo: day(60),
        isPublic: true,
        sourceUrl: "https://www.azrielimalls.co.il/malls/tel-aviv/coupons",
      },
      {
        mallSlug: "azrieli",
        description: "כניסה חינם לחניון בסופי שבוע (מבצע עתידי)",
        type: "gift",
        validFrom: day(10),
        validTo: day(40),
        isPublic: true,
        sourceUrl: "https://www.azrielimalls.co.il/malls/tel-aviv/coupons",
      },
      {
        mallSlug: "ramat-aviv",
        description: "מתנה בשווי ₪50 בקנייה מעל ₪400",
        type: "gift",
        discountAmount: 50,
        validTo: day(30),
        isPublic: true,
        sourceUrl: "https://www.ramat-aviv-mall.co.il/benefits",
      },
      // Birthday benefits (per club)
      {
        clubId: "cal",
        description: "הטבת יום הולדת: ₪50 מתנה לחברי מועדון כאל",
        type: "birthday",
        discountAmount: 50,
        isPublic: false,
        clubAppUrl: "https://www.cal-online.co.il/",
        sourceUrl: "https://www.cal-online.co.il/benefits",
      },
      {
        clubId: "leumi-card",
        description: "הטבת יום הולדת: 25% הנחה ברשתות נבחרות עם max",
        type: "birthday",
        discountPct: 25,
        isPublic: false,
        clubAppUrl: "https://www.max.co.il/",
        sourceUrl: "https://www.max.co.il/benefits",
      },
    ],
  });

  console.log(
    "Seed complete: clubs, stores, malls, sample products/prices, benefit_cache.",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
