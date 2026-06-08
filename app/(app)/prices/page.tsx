"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type PriceItem = {
  store: string;
  store_logo_url: string | null;
  product_name: string;
  barcode: string | null;
  price: number;
  unit: string | null;
  is_lowest: boolean;
  updated_at: string;
};
type PriceGroup = { manufacturer: string | null; items: PriceItem[] };

const STORE_NAMES: Record<string, string> = {
  shufersal: "שופרסל",
  "rami-levy": "רמי לוי",
  carrefour: "קרפור",
  yochananof: "יוחננוף",
};

export default function PricesPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<PriceGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError("יש להזין לפחות 2 תווים.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/prices/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("החיפוש נכשל. נסו שוב.");
      setGroups(null);
      return;
    }
    const data = (await res.json()) as { groups: PriceGroup[] };
    setGroups(data.groups);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-gradient text-3xl font-extrabold tracking-tight">
          השוואת מחירים
        </h1>
        <p className="text-sm text-muted-foreground">
          מצאו את המחיר הזול ביותר בין רשתות הסופר.
        </p>
      </header>

      <form onSubmit={search} className="flex gap-2">
        <Input
          placeholder="שם מוצר (לדוגמה: חלב 3%)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          חיפוש
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!loading && groups && groups.length === 0 && (
        <p className="text-muted-foreground">לא נמצאו תוצאות.</p>
      )}

      {!loading &&
        groups?.map((g, gi) => (
          <section key={gi} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {g.manufacturer ?? "ללא יצרן"}
            </h2>
            <div className="space-y-2">
              {g.items.map((it, ii) => (
                <Card key={ii}>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {STORE_NAMES[it.store] ?? it.store}
                        </span>
                        {it.is_lowest && (
                          <Badge variant="lowest">המחיר הנמוך</Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {it.product_name}
                        {it.unit ? ` · ${it.unit}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        עודכן: {new Date(it.updated_at).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                    <div className="shrink-0 text-xl font-bold">
                      ₪{it.price.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
