"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";

export function ReviewHelpfulButton({
  reviewId,
  initialCount,
  initialVoted,
  isLoggedIn,
  className,
}: {
  reviewId: string;
  initialCount: number;
  initialVoted: boolean;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (isSubmitting) return;

    const next = !voted;
    setVoted(next);
    setCount((prev) => prev + (next ? 1 : -1));
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) {
        setVoted(!next);
        setCount((prev) => prev - (next ? 1 : -1));
        return;
      }
      router.refresh();
    } catch {
      setVoted(!next);
      setCount((prev) => prev - (next ? 1 : -1));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={voted ? "추천 취소" : "추천"}
      aria-pressed={voted}
      onClick={toggle}
      className={cn(
        "flex items-center gap-1 rounded-[6px] px-2 py-1 text-xs font-semibold text-orange-600 transition-colors",
        voted ? "bg-orange-100" : "bg-orange-50 hover:bg-orange-100",
        className
      )}
    >
      <ThumbsUp className={cn("size-3.5", voted && "fill-orange-600")} />
      추천 {count}
    </button>
  );
}
