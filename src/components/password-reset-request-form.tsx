"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetRequestForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/password-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "문의 접수에 실패했습니다.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <p className="mt-2 text-center text-sm">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-primary underline-offset-4 hover:underline"
        >
          비밀번호를 잊으셨나요? 문의하기
        </button>
      </p>
    );
  }

  if (isSubmitted) {
    return <p className="mt-2 text-center text-sm text-muted-foreground">문의가 접수되었습니다.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password-request-email">가입 시 사용한 이메일</Label>
        <Input
          id="password-request-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "제출 중..." : "제출"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
          취소
        </Button>
      </div>
    </form>
  );
}
