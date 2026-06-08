import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Benefit = {
  id: string;
  description: string;
  type: "discount" | "cashback" | "gift" | "birthday";
  discount_pct: number | null;
  discount_amount: number | null;
  valid_from: string | null;
  valid_to: string | null;
  club_id: string | null;
  is_public: boolean;
  is_expired: boolean;
  club_app_url: string | null;
  source_url: string;
  image_url: string | null;
  store_slug: string | null;
  scraped_at: string;
};

const TYPE_LABEL: Record<Benefit["type"], string> = {
  discount: "הנחה",
  cashback: "קאשבק",
  gift: "מתנה",
  birthday: "יום הולדת",
};

// Colored accent strip (inline-start edge) per benefit type.
const TYPE_ACCENT: Record<Benefit["type"], string> = {
  discount: "bg-sky-400",
  cashback: "bg-emerald-400",
  gift: "bg-fuchsia-400",
  birthday: "bg-amber-400",
};

export function BenefitCard({ benefit }: { benefit: Benefit }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        benefit.is_expired && "opacity-50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 end-0 w-1",
          TYPE_ACCENT[benefit.type],
        )}
      />
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={benefit.type}>{TYPE_LABEL[benefit.type]}</Badge>
          {benefit.is_expired && (
            <span className="text-xs text-muted-foreground">פג תוקף</span>
          )}
        </div>
        <p className="text-sm text-foreground/90">{benefit.description}</p>
        {(benefit.discount_pct != null || benefit.discount_amount != null) && (
          <p className="text-gradient text-base font-bold">
            {benefit.discount_pct != null
              ? `${benefit.discount_pct}% הנחה`
              : `₪${benefit.discount_amount} הנחה`}
          </p>
        )}
        {benefit.valid_to && (
          <p className="text-xs text-muted-foreground">
            בתוקף עד {benefit.valid_to}
          </p>
        )}
        {benefit.club_app_url && (
          <a
            href={benefit.club_app_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-semibold text-aurora-teal transition-colors hover:text-aurora-cyan hover:underline"
          >
            לאפליקציה ←
          </a>
        )}
      </CardContent>
    </Card>
  );
}
