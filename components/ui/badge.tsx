import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        // Benefit types (PRD §7.2) — soft pastel on light glass
        discount: "border border-violet-300/60 bg-violet-500/15 text-violet-700",
        cashback: "border border-emerald-300/60 bg-emerald-500/15 text-emerald-700",
        gift: "border border-fuchsia-300/60 bg-fuchsia-500/15 text-fuchsia-700",
        birthday: "border border-orange-300/60 bg-orange-500/15 text-orange-700",
        lowest:
          "border-transparent bg-gradient-warm text-white shadow-soft-sm",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
