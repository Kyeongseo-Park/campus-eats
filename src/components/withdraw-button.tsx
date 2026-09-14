"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function WithdrawButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw() {
    setIsSubmitting(true);
    setError(null);
    const res = await fetch("/api/users/me", { method: "DELETE" });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setIsSubmitting(false);
      setError("탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-[30px] rounded-lg border border-gray-200 bg-white px-[11px] text-xs font-semibold text-gray-400 outline-none transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300"
      >
        탈퇴
      </button>

      <Dialog open={open} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
        <DialogContent showCloseButton={false} className="flex flex-col items-center gap-2 text-center">
          <AlertTriangle className="size-10 text-destructive" strokeWidth={1.5} aria-hidden />
          <DialogTitle>정말 탈퇴하시겠습니까?</DialogTitle>
          <p className="text-sm text-muted-foreground">
            작성한 리뷰는 남지만 즐겨찾기·제보 내역은 모두 삭제되며 되돌릴 수 없습니다.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleWithdraw}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "탈퇴 중..." : "탈퇴하기"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="w-full">
              취소
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
