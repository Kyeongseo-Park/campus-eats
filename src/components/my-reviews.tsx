"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarPicker, StaticStars } from "@/components/star-rating";

export type MyReviewItem = {
  id: string;
  rating: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  restaurant: { id: string; name: string };
};

export function MyReviewsSection({ reviews }: { reviews: MyReviewItem[] }) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  function startEditing(review: MyReviewItem) {
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

  if (reviews.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">작성한 리뷰가 없어요.</p>;
  }

  return (
    <ul className="mt-2 flex flex-col gap-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-lg border p-3">
          {editingId === review.id ? (
            <form onSubmit={(event) => handleEditSubmit(event, review.id)} className="flex flex-col gap-2">
              <Link href={`/restaurants/${review.restaurant.id}`} className="text-sm font-medium hover:underline">
                {review.restaurant.name}
              </Link>
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
                <Link href={`/restaurants/${review.restaurant.id}`} className="text-sm font-medium hover:underline">
                  {review.restaurant.name}
                </Link>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={() => startEditing(review)}>
                    수정
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleDelete(review.id)}>
                    삭제
                  </Button>
                </div>
              </div>
              <StaticStars rating={review.rating} />
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
  );
}
