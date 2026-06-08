"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BenefitCard, type Benefit } from "@/components/benefit-card";

const STORES: [string, string][] = [
  ["shufersal", "שופרסל"],
  ["rami-levy", "רמי לוי"],
  ["carrefour", "קרפור"],
  ["yochananof", "יוחננוף"],
];
const CLUBS: [string, string][] = [
  ["cal", "כאל"],
  ["leumi-card", "לאומי קארד"],
  ["moadon-haverim", "מועדון חברים"],
  ["jurocum", "יורוקום"],
];

export default function BenefitsPage() {
  const [storeSlug, setStoreSlug] = useState(STORES[0][0]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [benefits, setBenefits] = useState<Benefit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.clubs) setClubs(d.clubs as string[]);
      })
      .catch(() => {});
  }, []);

  function toggleClub(slug: string) {
    setClubs((c) =>
      c.includes(slug) ? c.filter((x) => x !== slug) : [...c, slug],
    );
  }

  async function search() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/benefits/by-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_slug: storeSlug, override_clubs: clubs }),
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

  const shown = (benefits ?? []).filter((b) =>
    onlyMine ? b.club_id != null : true,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="glow-text text-2xl font-bold">הטבות לפי חנות</h1>

      <div className="glass-dark space-y-4 rounded-lg p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">חנות</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-input/60 px-3 text-sm text-foreground transition-all focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={storeSlug}
            onChange={(e) => setStoreSlug(e.target.value)}
          >
            {STORES.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">המועדונים שלי (לחיפוש זה)</label>
          <div className="grid grid-cols-2 gap-2">
            {CLUBS.map(([slug, name]) => (
              <label key={slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={clubs.includes(slug)}
                  onChange={() => toggleClub(slug)}
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        <Button onClick={search} disabled={loading}>
          חיפוש הטבות
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {benefits && (
        <div className="flex gap-2">
          <Button
            variant={onlyMine ? "outline" : "default"}
            size="sm"
            onClick={() => setOnlyMine(false)}
          >
            הכל
          </Button>
          <Button
            variant={onlyMine ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyMine(true)}
          >
            שלי בלבד
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!loading && benefits && shown.length === 0 && (
        <p className="text-muted-foreground">לא נמצאו הטבות.</p>
      )}

      {!loading && (
        <div className="space-y-3">
          {shown.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}
