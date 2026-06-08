import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getBirthdayBenefits } from "@/lib/benefits";
import { IS_DEMO, demoBirthdayBenefits } from "@/lib/demo";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    birthdate?: string;
  } | null;

  const birthdate = body?.birthdate;
  if (
    !birthdate ||
    !DATE_RE.test(birthdate) ||
    Number.isNaN(Date.parse(birthdate))
  ) {
    return NextResponse.json({ error: "invalid birthdate" }, { status: 400 });
  }

  const birthMonth = Number(birthdate.slice(5, 7));

  if (IS_DEMO) {
    return NextResponse.json({
      birth_month: birthMonth,
      benefits: demoBirthdayBenefits(),
      sources_failed: [],
    });
  }

  const { benefits, sources_failed } = await getBirthdayBenefits();
  return NextResponse.json({ birth_month: birthMonth, benefits, sources_failed });
}
