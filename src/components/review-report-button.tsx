"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export function ReviewReportButton({
  reviewId,
  isLoggedIn,
  initialReported,
  className,
}: {
  reviewId: string;
  isLoggedIn: boolean;
  initialReported: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [reported, setReported] = useState(initialReported);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (reported || isSubmitting) return;

    const reason = prompt("신고 사유를 입력해주세요.")?.trim();
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok || res.status === 409) {
        setReported(true);
      } else {
        alert("신고 접수에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={reported}
      onClick={handleClick}
      disabled={reported || isSubmitting}
      className={cn(
        "text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:text-gray-400",
        className
      )}
    >
      {reported ? "신고완료" : "신고"}
    </button>
  );
}
