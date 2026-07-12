"use client";

import { useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LoginRequiredDialog } from "@/components/restaurants/detail/login-required-dialog";
import { ReviewComposerSheet } from "@/components/restaurants/detail/review-composer-sheet";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ReviewWithAuthor } from "@/lib/types";

export function ReviewTab({
  restaurantId,
  reviews,
  onReviewCreated,
}: {
  restaurantId: string;
  reviews: ReviewWithAuthor[];
  onReviewCreated: () => void;
}) {
  const { status } = useSession();
  const [composerOpen, setComposerOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  function handleWriteClick() {
    if (status === "authenticated") {
      setComposerOpen(true);
    } else {
      setLoginPromptOpen(true);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold">■ 학생 리뷰 (평균: ★ {avgRating.toFixed(1)})</p>
      <Button onClick={handleWriteClick}>✍️ 리뷰 작성하기</Button>

      {reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          아직 작성된 리뷰가 없어요.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-1 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {review.user.nickname} (★ {review.rating.toFixed(1)})
                </span>
                <span className="text-muted-foreground">{formatDate(review.createdAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{review.content}</p>
            </li>
          ))}
        </ul>
      )}

      <ReviewComposerSheet
        open={composerOpen}
        onOpenChange={setComposerOpen}
        restaurantId={restaurantId}
        onCreated={onReviewCreated}
      />
      <LoginRequiredDialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen} />
    </div>
  );
}
