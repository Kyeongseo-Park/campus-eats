"use client";

import Link from "next/link";

import { useSession } from "@/components/providers/session-provider";
import { buttonVariants } from "@/components/ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status, user } = useSession();

  if (status === "loading") {
    return <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
        <Link href="/login" className={buttonVariants()}>
          로그인하러 가기
        </Link>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-muted-foreground">관리자만 접근할 수 있는 페이지입니다.</p>
        <Link href="/" className={buttonVariants()}>
          홈으로
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
