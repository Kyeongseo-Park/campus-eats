"use client";

import Link from "next/link";

import { AdminGuard } from "@/components/admin/admin-guard";

const SECTIONS = [
  { href: "/admin/users", label: "회원 관리", description: "회원 목록 조회" },
  { href: "/admin/restaurants", label: "식당 관리", description: "식당 추가 · 수정 · 삭제" },
  { href: "/admin/reviews", label: "리뷰 관리", description: "리뷰 조회 · 삭제" },
  { href: "/admin/requests", label: "식당 제보 관리", description: "제보 승인 · 반려" },
];

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <div className="flex h-full flex-col">
        <header className="shrink-0 border-b px-4 py-3">
          <h1 className="text-lg font-semibold">관리자 대시보드</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-lg border p-4 hover:bg-muted/50"
              >
                <p className="font-semibold">{section.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
