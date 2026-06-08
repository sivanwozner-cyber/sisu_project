import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-gradient text-primary-foreground",
        secondary: "border-white/15 bg-white/10 text-foreground",
        outline: "border-white/20 text-foreground",
        // Benefit types (PRD §7.2) — translucent tints for the dark theme
        discount: "border-sky-400/30 bg-sky-400/15 text-sky-200",
        cashback: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
        gift: "border-fuchsia-400/30 bg-fuchsia-400/15 text-fuchsia-200",
        birthday: "border-amber-400/30 bg-amber-400/15 text-amber-200",
        lowest:
          "border-transparent bg-emerald-400/20 text-emerald-200 shadow-[0_0_18px_-4px_rgba(16,185,129,0.7)]",
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
