"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { RestaurantFormDialog } from "@/components/admin/restaurant-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, Zone } from "@/lib/constants";
import { priceRangeLabel } from "@/lib/format";
import type { AdminRestaurantItem } from "@/lib/types";

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<AdminRestaurantItem[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminRestaurantItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRestaurantItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadRestaurants() {
    fetch("/api/admin/restaurants")
      .then((res) => res.json())
      .then((data: { restaurants: AdminRestaurantItem[] }) => setRestaurants(data.restaurants ?? []))
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("식당 삭제에 실패했습니다.");
        return;
      }
      setRestaurants((prev) => prev?.filter((restaurant) => restaurant.id !== deleteTarget.id) ?? null);
      toast.success("식당이 삭제됐어요.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <AdminGuard>
      <AdminShell title="식당 관리">
        <div className="flex justify-end px-4 pt-3">
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> 식당 추가
          </Button>
        </div>

        {restaurants === null ? (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : restaurants.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">등록된 식당이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{restaurant.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {restaurant.category} · {restaurant.zone} · {priceRangeLabel(restaurant.minPrice)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="수정"
                    onClick={() => {
                      setEditTarget(restaurant);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="삭제"
                    onClick={() => setDeleteTarget(restaurant)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminShell>

      <RestaurantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editTarget ? "식당 수정" : "식당 추가"}
        submitLabel={editTarget ? "수정 완료" : "등록하기"}
        initialValues={
          editTarget
            ? {
                name: editTarget.name,
                category: editTarget.category as Category,
                zone: editTarget.zone as Zone,
                address: editTarget.address,
                latitude: String(editTarget.latitude),
                longitude: String(editTarget.longitude),
                minPrice: editTarget.minPrice != null ? String(editTarget.minPrice) : "",
                phone: editTarget.phone ?? "",
                kakaoPlaceId: editTarget.kakaoPlaceId ?? "",
              }
            : undefined
        }
        onSubmit={async (values) => {
          const url = editTarget ? `/api/admin/restaurants/${editTarget.id}` : "/api/admin/restaurants";
          const method = editTarget ? "PUT" : "POST";
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            return { error: data?.error ?? "저장에 실패했습니다." };
          }
          setFormOpen(false);
          toast.success(editTarget ? "식당 정보가 수정됐어요." : "식당이 등록됐어요.");
          loadRestaurants();
        }}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>&apos;{deleteTarget?.name}&apos; 식당을 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>
            삭제 후에는 복구할 수 없습니다. 관련 메뉴/리뷰/즐겨찾기도 함께 삭제됩니다.
          </DialogDescription>
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
