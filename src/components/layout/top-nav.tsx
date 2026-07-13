"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavItemActive } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden h-16 items-center border-b bg-background px-6 md:flex">
      <Link href="/" className="mr-8 text-lg font-semibold whitespace-nowrap">
        학식말고 뭐먹지?
      </Link>
      <nav className="flex items-center gap-6" aria-label="주요 메뉴">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-sm font-medium",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
