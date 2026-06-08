"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BenefitCard, type Benefit } from "@/components/benefit-card";

type Mall = { slug: string; name: string; distance_km: number | null };
type Query = { lat?: number; lng?: number; manual?: string };

export default function NearbyPage() {
  const [benefits, setBenefits] = useState<Benefit[] | null>(null);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<Query | null>(null);

  async function runSearch(q: Query, upcoming = includeUpcoming) {
    setLoading(true);
    setError(null);
    setLastQuery(q);
    const res = await fetch("/api/benefits/nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: q.lat ?? null,
        lng: q.lng ?? null,
        manual_location: q.manual ?? null,
        include_upcoming: upcoming,
      }),
    });
    setLoading(false);
    if (res.status === 404) {
      setError("לא נמצא קניון בטווח. נסו חיפוש ידני לפי שם.");
      setBenefits([]);
      setMalls([]);
      return;
    }
    if (!res.ok) {
      setError("החיפוש נכשל.");
      setBenefits(null);
      return;
    }
    const data = (await res.json()) as { matched_malls: Mall[]; benefits: Benefit[] };
    setMalls(data.matched_malls);
    setBenefits(data.benefits);
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("הדפדפן לא תומך באיתור מיקום.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("הגישה למיקום נדחתה. השתמשו בחיפוש ידני."),
    );
  }

  function toggleUpcoming() {
    const next = !includeUpcoming;
    setIncludeUpcoming(next);
    if (lastQuery) runSearch(lastQuery, next);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-gradient text-2xl font-bold">הטבות בקרבתי</h1>

      <div className="glass space-y-3 rounded-2xl p-4 shadow-soft">
        <Button onClick={locate} className="gap-2">
          <MapPin className="h-4 w-4" />
          אתר אותי
        </Button>
        <div className="flex gap-2">
          <Input
            placeholder="או הזינו שם קניון (לדוגמה: קניון עזריאלי)"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => manual.trim() && runSearch({ manual: manual.trim() })}
          >
            חיפוש
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {benefits && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {malls.map((m) => m.name).join(", ") || "אין קניונים"}
          </p>
          <Button variant="outline" size="sm" onClick={toggleUpcoming}>
            {includeUpcoming ? "פעיל היום" : "כולל עתידי"}
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

      {!loading && benefits && benefits.length === 0 && (
        <p className="text-muted-foreground">לא נמצאו הטבות בקרבת מקום.</p>
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
