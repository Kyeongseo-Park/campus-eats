"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, SquarePlus, User } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "홈", icon: Home, match: (pathname: string) => pathname === "/" },
  {
    href: "/mypage/favorites",
    label: "즐겨찾기",
    icon: Heart,
    match: (pathname: string) => pathname.startsWith("/mypage/favorites"),
  },
  {
    href: "/restaurant-requests/new",
    label: "제보하기",
    icon: SquarePlus,
    match: (pathname: string) => pathname.startsWith("/restaurant-requests"),
  },
  {
    href: "/mypage",
    label: "마이페이지",
    icon: User,
    match: (pathname: string) => pathname.startsWith("/mypage") && !pathname.startsWith("/mypage/favorites"),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary",
                active && "text-primary"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
