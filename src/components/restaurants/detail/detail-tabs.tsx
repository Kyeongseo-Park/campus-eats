"use client";

import { cn } from "@/lib/utils";

export const DETAIL_TABS = ["메뉴", "리뷰", "위치"] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

export function DetailTabs({
  value,
  onChange,
}: {
  value: DetailTab;
  onChange: (value: DetailTab) => void;
}) {
  return (
    <div className="flex shrink-0 border-b" role="tablist">
      {DETAIL_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 border-b-2 py-2.5 text-sm font-medium transition-colors",
            value === tab
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
