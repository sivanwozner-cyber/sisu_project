import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { matchMalls, getNearbyBenefits } from "@/lib/benefits";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    lat?: number | null;
    lng?: number | null;
    manual_location?: string | null;
    include_upcoming?: boolean;
  } | null;

  const lat = body?.lat ?? null;
  const lng = body?.lng ?? null;
  const manual = body?.manual_location ?? null;

  if (lat == null && lng == null && !manual) {
    return NextResponse.json({ error: "location required" }, { status: 400 });
  }

  const malls = await matchMalls(lat, lng, manual);
  if (malls.length === 0) {
    return NextResponse.json(
      { error: "no mall in range", matched_malls: [] },
      { status: 404 },
    );
  }

  const { benefits, upcoming_count } = await getNearbyBenefits(
    malls.map((m) => m.slug),
    Boolean(body?.include_upcoming),
  );

  return NextResponse.json({
    matched_malls: malls,
    benefits,
    upcoming_count,
    sources_failed: [],
  });
}
