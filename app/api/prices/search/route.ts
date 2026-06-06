import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchPrices } from "@/lib/prices";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    query?: string;
    category?: string | null;
  } | null;

  const query = body?.query?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const groups = await searchPrices(query, body?.category ?? null);
  return NextResponse.json({ groups });
}
