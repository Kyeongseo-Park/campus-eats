"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("이 리뷰를 삭제할까요? 되돌릴 수 없습니다.")) return;

    setIsDeleting(true);
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });

    if (res.ok) {
      router.refresh();
    } else {
      setIsDeleting(false);
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "삭제 중..." : "삭제"}
    </Button>
  );
}
