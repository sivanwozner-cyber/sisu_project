import { type NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // On initial sign-in, upsert into our custom users table.
      if (account && profile) {
        const googleId = (profile as { sub?: string }).sub ?? "";
        const email = (profile as { email?: string }).email ?? "";
        const name = (profile as { name?: string }).name;
        const user = await prisma.user.upsert({
          where: { email },
          update: { googleId, name },
          create: { email, googleId, name },
        });
        token.userId = user.id;
        token.profileComplete = user.profileComplete;
      } else if (trigger === "update" && token.userId) {
        // Refresh after onboarding/profile changes (client calls session.update()).
        const user = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { profileComplete: true },
        });
        if (user) token.profileComplete = user.profileComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.profileComplete = Boolean(token.profileComplete);
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
