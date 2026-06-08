"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Tag, Store, MapPin, Cake, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/prices", label: "השוואת מחירים", icon: Tag },
  { href: "/benefits", label: "הטבות לפי חנות", icon: Store },
  { href: "/nearby", label: "הטבות בקרבתי", icon: MapPin },
  { href: "/birthday", label: "הטבות יום הולדת", icon: Cake },
  { href: "/profile", label: "פרופיל", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="glass sticky top-0 flex h-screen w-64 shrink-0 flex-col border-y-0 border-r-0 border-l border-white/10 p-4">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="h-7 w-7 rounded-lg bg-brand-gradient shadow-glow-sm" />
        <span className="text-gradient text-lg font-extrabold tracking-tight">
          מחירים והטבות
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-brand-gradient-soft text-foreground shadow-glow-sm ring-1 ring-aurora-teal/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active
                    ? "text-aurora-teal"
                    : "text-muted-foreground group-hover:text-aurora-teal",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <Button
        variant="ghost"
        className="justify-start gap-3 text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        התנתקות
      </Button>
    </aside>
  );
}
