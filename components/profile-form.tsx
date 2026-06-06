"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Club = { slug: string; name: string };

export function ProfileForm({
  clubs,
  initialClubs,
  initialBirthdate,
  mode,
}: {
  clubs: Club[];
  initialClubs: string[];
  initialBirthdate: string | null;
  mode: "onboarding" | "profile";
}) {
  const router = useRouter();
  const { update } = useSession();
  const [selected, setSelected] = useState<string[]>(initialClubs);
  const [birthdate, setBirthdate] = useState(initialBirthdate ?? "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(slug: string) {
    setSelected((s) =>
      s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug],
    );
  }

  async function submit(opts?: { skip?: boolean }) {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    const payload = opts?.skip
      ? { clubs: [], birthdate: null }
      : { clubs: selected, birthdate: birthdate || null };
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      setError("שמירה נכשלה. בדקו את הנתונים ונסו שוב.");
      return;
    }
    await update();
    if (mode === "onboarding") {
      router.push("/");
    } else {
      setSavedMsg("נשמר בהצלחה.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>מועדוני חבר</Label>
        <div className="grid grid-cols-2 gap-2">
          {clubs.map((c) => (
            <label
              key={c.slug}
              className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={selected.includes(c.slug)}
                onChange={() => toggle(c.slug)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate">תאריך לידה (אופציונלי)</Label>
        <Input
          id="birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}

      <div className="flex gap-3">
        <Button onClick={() => submit()} disabled={saving}>
          {saving ? "שומר..." : mode === "onboarding" ? "סיום" : "שמירה"}
        </Button>
        {mode === "onboarding" && (
          <Button
            variant="ghost"
            onClick={() => submit({ skip: true })}
            disabled={saving}
          >
            דלג
          </Button>
        )}
      </div>
    </div>
  );
}
