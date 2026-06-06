import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const sessionUser = await getSessionUser();
  const [clubs, user] = await Promise.all([
    prisma.club.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    sessionUser
      ? prisma.user.findUnique({
          where: { id: sessionUser.id },
          include: { clubs: true },
        })
      : null,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>ברוכים הבאים — בואו נגדיר את הפרופיל</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            mode="onboarding"
            clubs={clubs}
            initialClubs={user?.clubs.map((c) => c.clubId) ?? []}
            initialBirthdate={
              user?.birthdate ? user.birthdate.toISOString().slice(0, 10) : null
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
