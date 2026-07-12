"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavItemActive } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="주요 메뉴"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
