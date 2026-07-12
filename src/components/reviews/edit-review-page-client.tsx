"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { ReviewForm } from "@/components/reviews/review-form";
import type { MyReviewItem } from "@/lib/types";

type LoadState = "loading" | "not-found" | "loaded";

export function EditReviewPageClient({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [review, setReview] = useState<MyReviewItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/reviews/${reviewId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          setLoadState("not-found");
          return;
        }
        const data: { review: MyReviewItem } = await res.json();
        setReview(data.review);
        setLoadState("loaded");
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, [reviewId]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 뒤로가기
        </button>
        <h1 className="font-semibold">리뷰 수정</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loadState === "loading" && (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {loadState === "not-found" && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            존재하지 않거나 수정 권한이 없는 리뷰입니다.
          </p>
        )}
        {loadState === "loaded" && review && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{review.restaurant.name}</p>
            <ReviewForm
              initialRating={review.rating}
              initialContent={review.content}
              submitLabel="수정 완료"
              onSubmit={async ({ rating, content }) => {
                const res = await fetch(`/api/reviews/${reviewId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rating, content }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                  return { error: data?.error ?? "리뷰 수정에 실패했습니다." };
                }
                toast.success("리뷰가 수정됐어요!");
                router.push("/mypage/reviews");
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
