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
        // Benefit types (PRD §7.2) — neon-on-dark
        discount: "border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan",
        cashback: "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
        gift: "border border-neon-violet/40 bg-neon-violet/10 text-violet-300",
        birthday: "border border-neon-magenta/40 bg-neon-magenta/10 text-pink-300",
        lowest:
          "border-transparent bg-primary text-primary-foreground shadow-glow-sm",
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
