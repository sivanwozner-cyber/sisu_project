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
    <aside className="flex w-64 shrink-0 flex-col border-l bg-card p-4">
      <div className="mb-6 px-2 text-lg font-bold">מחירים והטבות</div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              pathname === href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
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
