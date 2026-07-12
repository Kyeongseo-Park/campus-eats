"use client";

import { SORT_OPTIONS, type SortOption } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SortTabs({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-4 border-b px-4 py-2 text-sm">
      <span className="text-muted-foreground">정렬:</span>
      {SORT_OPTIONS.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name="sort"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-primary"
          />
          <span className={cn(value === option && "font-medium text-foreground")}>{option}</span>
        </label>
      ))}
    </div>
  );
}
