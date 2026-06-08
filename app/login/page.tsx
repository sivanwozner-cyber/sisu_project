"use client";

import { signIn } from "next-auth/react";
import { Sparkles, Tag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardContent className="space-y-8 p-8 text-center">
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-neon shadow-glow">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="glow-text text-3xl font-bold tracking-tight">
              מחירים והטבות
            </h1>
            <p className="text-sm text-muted-foreground">
              השוואת מחירים חכמה בין רשתות הסופר — ואיתור ההטבות האישיות שלך,
              במקום אחד.
            </p>
          </div>

          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-primary" />
              המחיר הזול
            </span>
            <span className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-secondary" />
              הטבות אישיות
            </span>
          </div>

          <Button
            variant="neon"
            size="lg"
            className="w-full animate-glow-pulse"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            התחבר עם Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
