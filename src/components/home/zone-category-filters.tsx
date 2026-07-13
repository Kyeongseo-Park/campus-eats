"use client";

import { CATEGORIES, ZONES, type Category, type Zone } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ZoneCategoryFiltersProps {
  zone: Zone | null;
  category: Category | null;
  onZoneChange: (zone: Zone | null) => void;
  onCategoryChange: (category: Category | null) => void;
}

export function ZoneCategoryFilters({
  zone,
  category,
  onZoneChange,
  onCategoryChange,
}: ZoneCategoryFiltersProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b bg-background px-3 py-2">
      <ChipRow
        items={ZONES}
        active={zone}
        onToggle={(item) => onZoneChange(zone === item ? null : item)}
      />
      <ChipRow
        items={CATEGORIES}
        active={category}
        onToggle={(item) => onCategoryChange(category === item ? null : item)}
      />
    </div>
  );
}

function ChipRow<T extends string>({
  items,
  active,
  onToggle,
}: {
  items: readonly T[];
  active: T | null;
  onToggle: (item: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {items.map((item) => {
        const isActive = item === active;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(item)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-foreground hover:bg-muted",
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
