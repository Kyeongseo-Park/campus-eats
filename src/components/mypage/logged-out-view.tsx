import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoggedOutView() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-3 border-b px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">로그인이 필요한 서비스입니다.</p>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          로그인 / 회원가입 하기
        </Link>
      </div>

      <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "m-4")}>
        ✍️ 새로운 식당 제보하기
      </Link>

      <p className="border-b px-4 py-3 text-sm font-semibold text-muted-foreground">
        ■ 내 리뷰 관리 (로그인 필요)
      </p>
      <p className="border-b px-4 py-3 text-sm font-semibold text-muted-foreground">
        ■ 내 제보 확인 (로그인 필요)
      </p>
    </div>
  );
}
