"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORIES, PRICE_RANGES, ZONES, type Category, type PriceRangeLabel, type Zone } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface RestaurantFilters {
  zone: Zone | null;
  category: Category | null;
  priceRange: PriceRangeLabel | null;
}

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RestaurantFilters;
  onApply: (filters: RestaurantFilters) => void;
}

export function FilterSheet({ open, onOpenChange, filters, onApply }: FilterSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-auto bottom-0 left-0 max-w-full w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl sm:max-w-full"
        showCloseButton
      >
        {/* open일 때만 마운트해서, 열 때마다 현재 적용된 필터로 초안이 새로 초기화되게 한다. */}
        {open && (
          <FilterSheetForm
            initialFilters={filters}
            onApply={(next) => {
              onApply(next);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterSheetForm({
  initialFilters,
  onApply,
}: {
  initialFilters: RestaurantFilters;
  onApply: (filters: RestaurantFilters) => void;
}) {
  const [draft, setDraft] = useState(initialFilters);

  return (
    <>
      <div className="flex items-center justify-between">
        <DialogTitle>상세 필터</DialogTitle>
        <button
          type="button"
          onClick={() => setDraft({ zone: null, category: null, priceRange: null })}
          className="mr-8 text-sm text-muted-foreground hover:text-foreground"
        >
          초기화 ↺
        </button>
      </div>

      <FilterGroup
        label="구역"
        items={ZONES}
        value={draft.zone}
        onChange={(zone) => setDraft((d) => ({ ...d, zone }))}
      />
      <FilterGroup
        label="카테고리"
        items={CATEGORIES}
        value={draft.category}
        onChange={(category) => setDraft((d) => ({ ...d, category }))}
      />
      <FilterGroup
        label="가격대 (메뉴 최저가 기준)"
        items={PRICE_RANGES.map((r) => r.label)}
        value={draft.priceRange}
        onChange={(priceRange) => setDraft((d) => ({ ...d, priceRange }))}
      />

      <button
        type="button"
        onClick={() => onApply(draft)}
        className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full")}
      >
        필터 적용하기
      </button>
    </>
  );
}

function FilterGroup<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">■ {label}</p>
      <div className="flex flex-wrap gap-2">
        <Chip label="전체" isActive={value === null} onClick={() => onChange(null)} />
        {items.map((item) => (
          <Chip key={item} label={item} isActive={value === item} onClick={() => onChange(item)} />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
