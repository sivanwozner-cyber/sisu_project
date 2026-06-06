import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.club.createMany({
    data: [
      { slug: "cal", name: "כאל", appUrl: "https://www.cal-online.co.il/" },
      { slug: "leumi-card", name: "לאומי קארד", appUrl: "https://www.max.co.il/" },
      { slug: "moadon-haverim", name: "מועדון חברים", appUrl: "https://www.moadon-haverim.co.il/" },
      { slug: "jurocum", name: "יורוקום", appUrl: "https://www.jurocum.co.il/" },
    ],
    skipDuplicates: true,
  });

  await prisma.store.createMany({
    data: [
      { slug: "shufersal", name: "שופרסל" },
      { slug: "rami-levy", name: "רמי לוי" },
      { slug: "carrefour", name: "קרפור" },
      { slug: "yochananof", name: "יוחננוף" },
    ],
    skipDuplicates: true,
  });

  await prisma.mall.createMany({
    data: [
      { slug: "azrieli", name: "קניון עזריאלי", lat: 32.0735, lng: 34.7925 },
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

  console.log("Seed complete: clubs, stores, malls, sample products/prices.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
