"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AdminResetPasswordButton({
  memberId,
  memberNickname,
}: {
  memberId: string;
  memberNickname: string;
}) {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    if (!confirm(`"${memberNickname}"님의 비밀번호를 임시 비밀번호로 초기화할까요?`)) return;

    setIsSubmitting(true);
    const res = await fetch(`/api/admin/members/${memberId}/reset-password`, { method: "POST" });
    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      alert(data.error ?? "초기화에 실패했습니다.");
      return;
    }

    setCopied(false);
    setTempPassword(data.tempPassword);
  }

  async function handleCopy() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
  }

  if (tempPassword) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{tempPassword}</code>
        <Button type="button" size="xs" variant="outline" onClick={handleCopy}>
          {copied ? "복사됨" : "복사"}
        </Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => setTempPassword(null)}>
          닫기
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleReset} disabled={isSubmitting}>
      {isSubmitting ? "처리 중..." : "비밀번호 초기화"}
    </Button>
  );
}
