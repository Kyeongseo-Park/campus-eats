"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { RestaurantFormDialog } from "@/components/admin/restaurant-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "@/lib/constants";
import { formatDate, requestStatusLabel } from "@/lib/format";
import type { AdminRequestItem } from "@/lib/types";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequestItem[] | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminRequestItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminRequestItem | null>(null);
  const [rejecting, setRejecting] = useState(false);

  function loadRequests() {
    fetch("/api/admin/requests")
      .then((res) => res.json())
      .then((data: { requests: AdminRequestItem[] }) => setRequests(data.requests ?? []))
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleReject() {
    if (!rejectTarget) return;

    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/requests/${rejectTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (!res.ok) {
        toast.error("반려 처리에 실패했습니다.");
        return;
      }
      toast.success("제보를 반려했어요.");
      loadRequests();
    } finally {
      setRejecting(false);
      setRejectTarget(null);
    }
  }

  return (
    <AdminGuard>
      <AdminShell title="식당 제보 관리">
        {requests === null ? (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : requests.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">접수된 제보가 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{request.restaurantName}</p>
                  <Badge variant="outline">{requestStatusLabel(request.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.category} · {request.address}
                </p>
                {request.menuInfo && (
                  <p className="text-sm text-muted-foreground">메뉴: {request.menuInfo}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  제보자: {request.user.nickname} ({request.user.email}) · {formatDate(request.createdAt)}
                </p>
                {request.status === "대기" && (
                  <div className="mt-1 flex gap-2">
                    <Button size="sm" onClick={() => setApproveTarget(request)}>
                      승인하기
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRejectTarget(request)}>
                      반려
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminShell>

      <RestaurantFormDialog
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title={`'${approveTarget?.restaurantName ?? ""}' 승인 — 등록 정보 확인`}
        submitLabel="승인하기"
        initialValues={
          approveTarget
            ? {
                name: approveTarget.restaurantName,
                category: approveTarget.category as Category,
                address: approveTarget.address,
              }
            : undefined
        }
        onSubmit={async (values) => {
          if (!approveTarget) return;
          const res = await fetch(`/api/admin/requests/${approveTarget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", ...values }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            return { error: data?.error ?? "승인 처리에 실패했습니다." };
          }
          setApproveTarget(null);
          toast.success("제보를 승인하고 식당을 등록했어요.");
          loadRequests();
        }}
      />

      <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>&apos;{rejectTarget?.restaurantName}&apos; 제보를 반려하시겠습니까?</DialogTitle>
          <DialogDescription>
            반려하면 제보자는 마이페이지에서 반려 상태를 확인할 수 있습니다.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? "처리 중..." : "반려"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
