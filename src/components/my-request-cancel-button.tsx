"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function MyRequestCancelButton({
  requestId,
  restaurantName,
  variant = "cancel",
}: {
  requestId: string;
  restaurantName: string;
  variant?: "cancel" | "delete";
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const label = variant === "cancel" ? "취소" : "삭제";
  const confirmMessage =
    variant === "cancel" ? `"${restaurantName}" 제보를 취소할까요?` : `"${restaurantName}" 제보를 삭제할까요?`;
  const failureMessage = variant === "cancel" ? "제보 취소에 실패했습니다." : "제보 삭제에 실패했습니다.";

  async function handleClick() {
    if (!confirm(confirmMessage)) return;

    setIsSubmitting(true);
    const res = await fetch(`/api/restaurant-requests/${requestId}`, { method: "DELETE" });

    if (res.ok) {
      router.refresh();
    } else {
      setIsSubmitting(false);
      alert(failureMessage);
    }
  }

  return (
    <Button type="button" size="xs" variant="ghost" onClick={handleClick} disabled={isSubmitting}>
      {isSubmitting ? `${label} 중...` : label}
    </Button>
  );
}
