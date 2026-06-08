import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { IS_DEMO, DEMO_USER, demoProfile } from "@/lib/demo";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function demoSerialize() {
  return {
    id: DEMO_USER.id,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    birthdate: demoProfile.birthdate,
    clubs: demoProfile.clubs,
    profile_complete: true,
  };
}

type UserWithClubs = {
  id: string;
  name: string | null;
  email: string;
  birthdate: Date | null;
  profileComplete: boolean;
  clubs: { clubId: string }[];
};

function serialize(user: UserWithClubs) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    birthdate: user.birthdate ? user.birthdate.toISOString().slice(0, 10) : null,
    clubs: user.clubs.map((c) => c.clubId),
    profile_complete: user.profileComplete,
  };
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (IS_DEMO) return NextResponse.json(demoSerialize());

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { clubs: true },
  });
  if (!user)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(serialize(user));
}

export async function PATCH(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    birthdate?: string | null;
    clubs?: string[];
  } | null;
  if (!body)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { birthdate } = body;
  if (
    birthdate != null &&
    (typeof birthdate !== "string" ||
      !DATE_RE.test(birthdate) ||
      Number.isNaN(Date.parse(birthdate)))
  ) {
    return NextResponse.json({ error: "invalid_birthdate" }, { status: 400 });
  }

  const clubIds = Array.isArray(body.clubs) ? body.clubs : [];
  if (clubIds.length) {
    const existing = await prisma.club.findMany({
      where: { slug: { in: clubIds } },
      select: { slug: true },
    });
    if (existing.length !== new Set(clubIds).size) {
      return NextResponse.json({ error: "invalid_club" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        birthdate: birthdate ? new Date(birthdate) : null,
        profileComplete: true,
      },
    }),
    prisma.userClub.deleteMany({ where: { userId: sessionUser.id } }),
    ...(clubIds.length
      ? [
          prisma.userClub.createMany({
            data: clubIds.map((clubId) => ({ userId: sessionUser.id, clubId })),
          }),
        ]
      : []),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { clubs: true },
  });
  return NextResponse.json(serialize(user!));
}
