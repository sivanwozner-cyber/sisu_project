"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">השוואת מחירים והטבות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            התחבר עם Google
          </Button>
          {IS_DEMO && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/prices")}
            >
              כניסה למצב דמו (ללא התחברות)
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
