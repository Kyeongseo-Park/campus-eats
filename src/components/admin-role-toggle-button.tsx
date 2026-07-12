"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminRoleToggleButton({
  memberId,
  memberNickname,
  role,
}: {
  memberId: string;
  memberNickname: string;
  role: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = role === "admin";
  const nextRole = isAdmin ? "user" : "admin";
  const confirmMessage = isAdmin
    ? `"${memberNickname}"님의 관리자 권한을 해제할까요?`
    : `"${memberNickname}"님에게 관리자 권한을 부여할까요?`;

  async function handleToggle() {
    if (!confirm(confirmMessage)) return;

    setIsSubmitting(true);
    const res = await fetch(`/api/admin/members/${memberId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await res.json().catch(() => null);
    setIsSubmitting(false);

    if (!res.ok) {
      alert(data?.error ?? "권한 변경에 실패했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleToggle} disabled={isSubmitting}>
      {isSubmitting ? "처리 중..." : isAdmin ? "관리자 해제" : "관리자 부여"}
    </Button>
  );
}
