import { prisma } from "@/lib/prisma";
import type { IngestResult } from "./types";

/** Upserts a normalized ingestion result into products/prices. */
export async function upsertIngest(result: IngestResult) {
  for (const p of result.products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {
        name: p.name,
        manufacturer: p.manufacturer ?? null,
        unit: p.unit ?? null,
        category: p.category ?? null,
      },
      create: {
        barcode: p.barcode,
        name: p.name,
        manufacturer: p.manufacturer ?? null,
        unit: p.unit ?? null,
        category: p.category ?? null,
      },
    });
  }

  if (result.prices.length) {
    await prisma.price.createMany({
      data: result.prices.map((pr) => ({
        barcode: pr.barcode,
        chainSlug: pr.chainSlug,
        storeBranch: pr.storeBranch ?? null,
        price: pr.price,
        promoPrice: pr.promoPrice ?? null,
      })),
    });
  }
}
