"use client";

import { signIn } from "next-auth/react";
import { Tag, Gift, Cake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const IS_DEMO =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEMO !== "0";

const FEATURES = [
  { icon: Tag, label: "השוואת מחירים בין הרשתות" },
  { icon: Gift, label: "הטבות מועדון אישיות" },
  { icon: Cake, label: "הטבות יום הולדת" },
];

export default function LoginPage() {
  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="animate-fade-up w-full max-w-2xl text-center">
        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-aurora-teal backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          חוסכים כסף חכם · 2026
        </div>

        {/* Hero headline */}
        <h1 className="text-balance text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          <span className="text-gradient">כל המחירים.</span>
          <br />
          <span className="text-foreground">כל ההטבות. במקום אחד.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          השוואת מחירים בין רשתות הסופר מקבצי השקיפות הרשמיים, ואיתור הטבות
          אישיות לפי המועדונים ותאריך הלידה שלכם.
        </p>

        {/* Glass action card */}
        <div className="glass-card mx-auto mt-9 flex w-full max-w-sm flex-col gap-3 rounded-2xl p-6">
          <Button
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            התחבר עם Google
          </Button>
          {IS_DEMO && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => (window.location.href = "/prices")}
            >
              כניסה למצב דמו (ללא התחברות)
            </Button>
          )}
        </div>

        {/* Feature chips */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/80"
            >
              <Icon className="h-4 w-4 text-aurora-teal" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
