"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import type { MyReviewItem } from "@/lib/types";

export default function MyReviewsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [reviews, setReviews] = useState<MyReviewItem[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyReviewItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data: { reviews: MyReviewItem[] }) => setReviews(data.reviews ?? []))
      .catch((error) => console.error(error));
  }, [status]);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("리뷰 삭제에 실패했습니다.");
        return;
      }
      setReviews((prev) => prev?.filter((review) => review.id !== deleteTarget.id) ?? null);
      toast.success("리뷰가 삭제됐어요.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
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
        <h1 className="font-semibold">내 리뷰 관리</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {status !== "authenticated" || reviews === null ? (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : reviews.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            아직 작성한 리뷰가 없어요.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-2 px-4 py-4">
                <Link
                  href={`/restaurants/${review.restaurant.id}`}
                  className="font-semibold hover:underline"
                >
                  {review.restaurant.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  별점: ★ {review.rating.toFixed(1)} | {formatDate(review.createdAt)}
                </p>
                <p className="text-sm">{review.content}</p>
                <div className="mt-1 flex gap-2">
                  <Link
                    href={`/reviews/${review.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Pencil className="size-3.5" /> 수정
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(review)}>
                    <Trash2 className="size-3.5" /> 삭제
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>삭제 후에는 복구할 수 없습니다.</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
