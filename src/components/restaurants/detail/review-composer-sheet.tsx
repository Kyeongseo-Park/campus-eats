"use client";

import { ReviewForm } from "@/components/reviews/review-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ReviewComposerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  onCreated: () => void;
}

export function ReviewComposerSheet({
  open,
  onOpenChange,
  restaurantId,
  onCreated,
}: ReviewComposerSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-0 left-0 max-w-full w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl sm:max-w-full">
        {/* open일 때만 마운트해서 매번 빈 폼으로 새로 시작하게 한다. */}
        {open && (
          <>
            <DialogTitle>리뷰 작성하기</DialogTitle>
            <ReviewForm
              submitLabel="등록하기"
              onCancel={() => onOpenChange(false)}
              onSubmit={async ({ rating, content }) => {
                const res = await fetch("/api/reviews", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ restaurantId, rating, content }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                  return { error: data?.error ?? "리뷰 등록에 실패했습니다." };
                }
                onOpenChange(false);
                onCreated();
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
