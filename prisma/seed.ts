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

  console.log("Seed complete: clubs, stores, malls.");
  console.log("Run /api/cron/ingest (or `adapters[].ingest()`) to populate products/prices from the official feeds.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
