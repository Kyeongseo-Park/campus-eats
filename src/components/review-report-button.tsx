"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

// 신고 접수/관리 백엔드(모델·API)는 아직 없다. 지금은 UI 토글만 두고, 실제 신고 처리는
// 팀원 확인 후 별도로 구현한다 — 클릭하면 로컬 상태만 "신고완료"로 바뀌고 서버에는 전달되지 않는다.
export function ReviewReportButton({ isLoggedIn, className }: { isLoggedIn: boolean; className?: string }) {
  const router = useRouter();
  const [reported, setReported] = useState(false);

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (reported) return;
    if (!confirm("이 리뷰를 신고하시겠어요?")) return;

    setReported(true);
  }

  return (
    <button
      type="button"
      aria-pressed={reported}
      onClick={handleClick}
      disabled={reported}
      className={cn(
        "text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:text-gray-400",
        className
      )}
    >
      {reported ? "신고완료" : "신고"}
    </button>
  );
}
