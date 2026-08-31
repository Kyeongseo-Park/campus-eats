import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";

export const metadata: Metadata = {
  title: "접근 권한 없음",
};

// 관리자가 아닌 사용자가 /admin 하위 경로에 접근했을 때 requireAdmin()이 이 페이지로 보낸다.
export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <ErrorState
        icon={ShieldAlert}
        title="접근 권한이 없어요"
        description="관리자만 볼 수 있는 페이지예요."
        action={
          <Button nativeButton={false} render={<Link href="/" />} variant="outline" size="sm">
            홈으로
          </Button>
        }
      />
    </main>
  );
}
