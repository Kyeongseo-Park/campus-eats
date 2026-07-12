"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminRequestRejectButton({
  requestId,
  restaurantName,
}: {
  requestId: string;
  restaurantName: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReject() {
    if (!confirm(`"${restaurantName}" 제보를 반려할까요?`)) return;

    setIsSubmitting(true);
    const res = await fetch(`/api/admin/restaurant-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "반려" }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      setIsSubmitting(false);
      alert("반려 처리에 실패했습니다.");
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={handleReject} disabled={isSubmitting}>
      {isSubmitting ? "처리 중..." : "반려"}
    </Button>
  );
}
