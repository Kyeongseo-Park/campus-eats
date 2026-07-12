"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/restaurants", label: "식당 관리" },
  { href: "/admin/reviews", label: "리뷰 관리" },
  { href: "/admin/requests", label: "제보 관리" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b px-4 py-3">
        <Link href="/admin" className="text-xs text-muted-foreground hover:underline">
          ← 관리자 대시보드
        </Link>
        <h1 className="mt-1 text-lg font-semibold">{title}</h1>
      </header>
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b px-4 py-2">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
