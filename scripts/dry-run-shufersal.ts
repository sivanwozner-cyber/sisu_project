import { shufersal } from "../lib/ingestion/shufersal";

async function main() {
  const result = await shufersal.ingest();
  console.log("products:", result.products.length);
  console.log("prices:", result.prices.length);
  console.log("\nsample products:");
  for (const p of result.products.slice(0, 5)) console.log(p);
  console.log("\nsample prices:");
  for (const p of result.prices.slice(0, 5)) console.log(p);

  const withPromo = result.prices.filter((p) => p.promoPrice !== null && p.promoPrice !== undefined);
  console.log("\nprices with promo:", withPromo.length);
  for (const p of withPromo.slice(0, 3)) console.log(p);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
