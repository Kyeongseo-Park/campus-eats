"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// 리뷰·제보 작성 중 세션이 끊겨 제출이 401로 실패했을 때, 하던 작업 위에 끼워 넣는 인터럽트 모달.
// 전역 마운트가 아니라 각 폼이 open 상태를 직접 들고 있는다 (layout.tsx는 건드리지 않음).
// [취소]는 모달만 닫고 작성 내용은 그대로 두어, 재로그인 없이 상황을 판단할 수 있게 한다.
export function SessionExpiredDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="flex flex-col items-center gap-2 text-center">
        <Clock className="size-10 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        <DialogTitle>세션이 만료됐어요</DialogTitle>
        <p className="text-sm text-muted-foreground">다시 로그인하면 이어서 진행할 수 있어요.</p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Button nativeButton={false} render={<Link href={loginHref} />} className="w-full">
            다시 로그인
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} className="w-full">
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
