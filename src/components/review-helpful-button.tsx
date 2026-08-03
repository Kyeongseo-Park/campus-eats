"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={voted ? "도움돼요 취소" : "도움돼요"}
      aria-pressed={voted}
      onClick={toggle}
      className={cn("gap-1", className)}
    >
      <ThumbsUp className={cn("size-4", voted && "fill-blue-500 text-blue-500")} />
      도움돼요 {count}
    </Button>
  );
}
