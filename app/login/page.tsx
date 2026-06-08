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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-warm shadow-soft-warm animate-float">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-gradient text-3xl font-bold tracking-tight">
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
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            התחבר עם Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
