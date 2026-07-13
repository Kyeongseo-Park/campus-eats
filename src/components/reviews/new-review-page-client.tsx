"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { ReviewForm } from "@/components/reviews/review-form";

export function NewReviewPageClient({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 뒤로가기
        </button>
        <h1 className="font-semibold">리뷰 작성</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <ReviewForm
          submitLabel="등록하기"
          onSubmit={async ({ rating, content }) => {
            const res = await fetch("/api/reviews", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ restaurantId, rating, content }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              return { error: data?.error ?? "리뷰 등록에 실패했습니다." };
            }
            toast.success("리뷰가 등록됐어요!");
            router.push(`/restaurants/${restaurantId}`);
          }}
        />
      </div>
    </div>
  );
}
