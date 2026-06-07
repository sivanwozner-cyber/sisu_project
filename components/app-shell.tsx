"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // סגירת התפריט הנייד בכל ניווט לדף חדש
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="flex items-center justify-between border-b bg-card p-4 md:hidden">
        <span className="text-lg font-bold">מחירים והטבות</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="פתיחת תפריט ניווט"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
