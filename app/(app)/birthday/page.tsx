"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BenefitCard, type Benefit } from "@/components/benefit-card";

export default function BirthdayPage() {
  const [birthdate, setBirthdate] = useState("");
  const [fromProfile, setFromProfile] = useState(false);
  const [benefits, setBenefits] = useState<Benefit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.birthdate) {
          setBirthdate(d.birthdate as string);
          setFromProfile(true);
        }
      })
      .catch(() => {});
  }, []);

  async function search() {
    if (!birthdate) {
      setError("יש להזין תאריך לידה.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/benefits/birthday", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthdate }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("החיפוש נכשל.");
      setBenefits(null);
      return;
    }
    const data = (await res.json()) as { benefits: Benefit[] };
    setBenefits(data.benefits);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="glow-text text-2xl font-bold">הטבות יום הולדת</h1>

      <div className="glass-dark space-y-3 rounded-lg p-4">
        <div className="space-y-2">
          <Label htmlFor="bd">תאריך לידה</Label>
          <Input
            id="bd"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
          {!fromProfile && (
            <p className="text-xs text-muted-foreground">
              לשמירה קבועה עדכנו את התאריך בעמוד הפרופיל.
            </p>
          )}
        </div>
        <Button onClick={search} disabled={loading}>
          חיפוש הטבות
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!loading && benefits && benefits.length === 0 && (
        <p className="text-muted-foreground">לא נמצאו הטבות יום הולדת.</p>
      )}

      {!loading && (
        <div className="space-y-3">
          {(benefits ?? []).map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}
