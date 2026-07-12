"use client";

import { RestaurantForm, type RestaurantFormValues } from "@/components/admin/restaurant-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Category, Zone } from "@/lib/constants";

interface RestaurantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValues?: Partial<RestaurantFormValues>;
  submitLabel: string;
  onSubmit: (values: {
    name: string;
    category: Category;
    zone: Zone;
    address: string;
    latitude: number;
    longitude: number;
    minPrice: number | null;
    phone: string | null;
    kakaoPlaceId: string | null;
  }) => Promise<{ error?: string } | void>;
}

export function RestaurantFormDialog({
  open,
  onOpenChange,
  title,
  initialValues,
  submitLabel,
  onSubmit,
}: RestaurantFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* open일 때만 마운트해서 매번 initialValues 기준으로 새로 시작하게 한다. */}
        {open && (
          <>
            <DialogTitle>{title}</DialogTitle>
            <RestaurantForm
              initialValues={initialValues}
              submitLabel={submitLabel}
              onCancel={() => onOpenChange(false)}
              onSubmit={onSubmit}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
