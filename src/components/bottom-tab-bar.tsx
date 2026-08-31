"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Pen, User, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  /// 활성 시 아이콘 몸통을 orange-100으로 채운다 (리뷰 탭 펜 아이콘 전용).
  fillWhenActive?: boolean;
  match: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: Home, match: (pathname) => pathname === "/" },
  {
    href: "/reviews",
    label: "리뷰",
    icon: Pen,
    fillWhenActive: true,
    match: (pathname) => pathname.startsWith("/reviews"),
  },
  {
    href: "/mypage/favorites",
    label: "즐겨찾기",
    icon: Heart,
    match: (pathname) => pathname.startsWith("/mypage/favorites"),
  },
  {
    href: "/mypage",
    label: "마이페이지",
    icon: User,
    match: (pathname) => pathname.startsWith("/mypage") && !pathname.startsWith("/mypage/favorites"),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, fillWhenActive, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-12 flex-col items-center gap-[3px] pb-3 outline-none transition-opacity duration-[120ms] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300 active:opacity-60"
            >
              <span
                className={cn(
                  "mb-2 h-0.5 w-full transition-colors duration-[180ms] ease-out",
                  active ? "bg-orange-500" : "bg-transparent"
                )}
              />
              <Icon
                className={cn(
                  "size-[21px]",
                  active ? "text-orange-500" : "text-gray-500",
                  active && fillWhenActive ? "fill-orange-100" : "fill-none"
                )}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <span className={cn("text-[11px] font-semibold", active ? "text-orange-500" : "text-gray-500")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
