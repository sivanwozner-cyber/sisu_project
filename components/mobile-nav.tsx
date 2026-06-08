"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/components/sidebar";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-white/40 px-1 py-1.5 shadow-soft md:hidden">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-medium transition-all",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn("h-5 w-5 transition-transform", active && "scale-110")}
            />
            <span className="truncate px-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
