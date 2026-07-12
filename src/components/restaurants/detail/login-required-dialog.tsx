"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function LoginRequiredDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogTitle>로그인이 필요한 기능입니다.</DialogTitle>
        <DialogDescription>리뷰를 작성하려면 먼저 로그인해주세요.</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={() => router.push("/login")}>로그인하러 가기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
