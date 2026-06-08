"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/components/sidebar";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="glass-dark fixed inset-x-0 bottom-0 z-40 flex border-t border-white/5 px-1 py-1.5 md:hidden">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-all",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]")}
            />
            <span className="truncate px-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
