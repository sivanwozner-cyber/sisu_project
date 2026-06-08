import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { IS_DEMO, DEMO_CLUBS, demoProfile } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (IS_DEMO) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">פרופיל</h1>
        <Card>
          <CardContent className="pt-6">
            <ProfileForm
              mode="profile"
              clubs={DEMO_CLUBS}
              initialClubs={demoProfile.clubs}
              initialBirthdate={demoProfile.birthdate}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">פרופיל</h1>
      <Card>
        <CardContent className="pt-6">
          <ProfileForm
            mode="profile"
            clubs={clubs}
            initialClubs={user?.clubs.map((c) => c.clubId) ?? []}
            initialBirthdate={
              user?.birthdate ? user.birthdate.toISOString().slice(0, 10) : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
