import { NextResponse } from "next/server";
import { adapters } from "@/lib/ingestion";
import { upsertIngest } from "@/lib/ingestion/upsert";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Scheduled price ingestion (Vercel Cron — see vercel.json). */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ingested: Record<string, number> = {};
  for (const adapter of adapters) {
    const result = await adapter.ingest();
    await upsertIngest(result);
    ingested[adapter.slug] = result.prices.length;
  }
  return NextResponse.json({ ingested });
}
