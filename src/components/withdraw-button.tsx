"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WithdrawButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (
      !confirm("정말 탈퇴하시겠습니까?\n작성한 리뷰는 남지만 즐겨찾기·제보 내역은 모두 삭제되며 되돌릴 수 없습니다.")
    ) {
      return;
    }

    setIsSubmitting(true);
    const res = await fetch("/api/users/me", { method: "DELETE" });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setIsSubmitting(false);
      alert("탈퇴에 실패했습니다.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      className="h-[30px] rounded-lg border border-gray-200 bg-white px-[11px] text-xs font-semibold text-gray-400 outline-none transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300"
    >
      {isSubmitting ? "탈퇴 중..." : "탈퇴"}
    </button>
  );
}
