"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminPasswordRequestCompleteButton({ requestId, email }: { requestId: string; email: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleComplete() {
    if (!confirm(`"${email}" 문의를 처리완료로 표시할까요?`)) return;

    setIsSubmitting(true);
    const res = await fetch(`/api/admin/password-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "처리완료" }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      setIsSubmitting(false);
      alert("처리 상태 변경에 실패했습니다.");
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleComplete} disabled={isSubmitting}>
      {isSubmitting ? "처리 중..." : "처리완료"}
    </Button>
  );
}
