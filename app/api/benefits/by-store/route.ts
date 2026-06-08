import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStoreBenefits } from "@/lib/benefits";
import { IS_DEMO, demoStoreBenefits, demoProfile } from "@/lib/demo";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    store_slug?: string;
    override_clubs?: string[];
  } | null;

  const storeSlug = body?.store_slug;
  if (!storeSlug || typeof storeSlug !== "string") {
    return NextResponse.json({ error: "store_slug required" }, { status: 400 });
  }

  if (IS_DEMO) {
    const clubs = Array.isArray(body?.override_clubs)
      ? body!.override_clubs!
      : demoProfile.clubs;
    return NextResponse.json({
      user_clubs: clubs,
      benefits: demoStoreBenefits(storeSlug, clubs),
      cache_hit: true,
      sources_failed: [],
    });
  }

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) {
    return NextResponse.json({ error: "store not found" }, { status: 404 });
  }

  let clubs: string[];
  if (Array.isArray(body?.override_clubs)) {
    clubs = body!.override_clubs!;
  } else {
    const uc = await prisma.userClub.findMany({
      where: { userId: user.id },
      select: { clubId: true },
    });
    clubs = uc.map((c) => c.clubId);
  }

  const { benefits, cacheHit, sourcesFailed } = await getStoreBenefits(
    storeSlug,
    clubs,
  );
  return NextResponse.json({
    user_clubs: clubs,
    benefits,
    cache_hit: cacheHit,
    sources_failed: sourcesFailed,
  });
}
