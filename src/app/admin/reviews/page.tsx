"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import type { AdminReviewItem } from "@/lib/types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then((data: { reviews: AdminReviewItem[] }) => setReviews(data.reviews ?? []))
      .catch((error) => console.error(error));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget.id}`, { method: "DELETE" });
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
    <AdminGuard>
      <AdminShell title="리뷰 관리">
        {reviews === null ? (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : reviews.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">등록된 리뷰가 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {review.restaurant.name} · {review.user.nickname} (★ {review.rating.toFixed(1)})
                  </span>
                  <span className="text-muted-foreground">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{review.content}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit"
                  onClick={() => setDeleteTarget(review)}
                >
                  <Trash2 className="size-3.5" /> 삭제
                </Button>
              </li>
            ))}
          </ul>
        )}
      </AdminShell>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>이 리뷰를 삭제하시겠습니까?</DialogTitle>
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
    </AdminGuard>
  );
}
