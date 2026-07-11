"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: { nickname: string };
};

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star}점`} className="p-0.5">
          <Star className={cn("size-5", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("size-4", star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
        />
      ))}
    </div>
  );
}

export function ReviewSection({
  restaurantId,
  reviews,
  currentUserId,
}: {
  restaurantId: string;
  reviews: ReviewItem[];
  currentUserId: string | null;
}) {
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("한줄평을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, rating, content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "리뷰 작성에 실패했습니다.");
        return;
      }

      setContent("");
      setRating(5);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(review: ReviewItem) {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, reviewId: string) {
    event.preventDefault();
    if (!editContent.trim()) return;

    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: editRating, content: editContent }),
    });

    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("리뷰를 삭제할까요?")) return;

    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 리뷰가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border p-3">
              {editingId === review.id ? (
                <form onSubmit={(event) => handleEditSubmit(event, review.id)} className="flex flex-col gap-2">
                  <StarPicker value={editRating} onChange={setEditRating} />
                  <Input value={editContent} onChange={(event) => setEditContent(event.target.value)} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      저장
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      취소
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{review.user.nickname}</span>
                      <StaticStars rating={review.rating} />
                    </div>
                    {currentUserId === review.userId && (
                      <div className="flex gap-1">
                        <Button size="xs" variant="ghost" onClick={() => startEditing(review)}>
                          수정
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleDelete(review.id)}>
                          삭제
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    {review.content}
                    {review.updatedAt.getTime() !== review.createdAt.getTime() && (
                      <span className="ml-1 text-xs text-muted-foreground">(수정됨)</span>
                    )}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {currentUserId ? (
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-2 rounded-lg border p-3">
          <span className="text-sm font-medium">리뷰 작성</span>
          <StarPicker value={rating} onChange={setRating} />
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="한줄평을 남겨주세요"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? "등록 중..." : "리뷰 등록"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="underline">
            로그인
          </Link>{" "}
          후 리뷰를 작성할 수 있어요.
        </p>
      )}
    </div>
  );
}
