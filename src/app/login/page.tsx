"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SafeUser } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setUser(data.user as SafeUser);
      router.push("/mypage");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 뒤로가기
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
        <div className="text-center">
          <h1 className="text-xl font-semibold">학식말고 뭐먹지?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            학교 주변 찐 맛집 정보를
            <br />
            지금 바로 확인해 보세요!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting} className="mt-1">
            {submitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
