"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, PRICE_RANGES, ZONES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };
type FilterKey = "zone" | "category" | "price_range";

const ZONE_OPTIONS: Option[] = ZONES.map((zone) => ({ value: zone, label: zone }));
const CATEGORY_OPTIONS: Option[] = CATEGORIES.map((category) => ({ value: category, label: category }));

function parseMulti(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function RestaurantFilters({ onZoneChange }: { onZoneChange?: (zones: string[]) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [qInput, setQInput] = useState(searchParams.get("q") ?? "");
  const [openPanel, setOpenPanel] = useState<FilterKey | null>(null);

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function togglePanel(key: FilterKey) {
    setOpenPanel((prev) => (prev === key ? null : key));
  }

  function toggleMultiValue(key: "zone" | "category" | "price_range", value: string) {
    const current = parseMulti(searchParams.get(key));
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    navigate({ [key]: next.length > 0 ? next.join(",") : null });
    if (key === "zone") onZoneChange?.(next);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: qInput });
  }

  const selectedZones = parseMulti(searchParams.get("zone"));
  const selectedCategories = parseMulti(searchParams.get("category"));
  const selectedPriceRanges = parseMulti(searchParams.get("price_range"));
  const partnershipOnly = searchParams.get("partnership_only") === "true";

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          type="text"
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
          placeholder="식당명 또는 메뉴명 검색"
          className="max-w-xs"
        />
        <Button type="submit">검색</Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <FilterMenuButton
          label="구역"
          count={selectedZones.length}
          isOpen={openPanel === "zone"}
          onClick={() => togglePanel("zone")}
        />
        <FilterMenuButton
          label="카테고리"
          count={selectedCategories.length}
          isOpen={openPanel === "category"}
          onClick={() => togglePanel("category")}
        />
        <FilterMenuButton
          label="가격대"
          count={selectedPriceRanges.length}
          isOpen={openPanel === "price_range"}
          onClick={() => togglePanel("price_range")}
        />

        <div className="ml-auto flex items-center gap-2">
          <PartnershipChip
            active={partnershipOnly}
            onClick={() => navigate({ partnership_only: partnershipOnly ? null : "true" })}
          />
        </div>
      </div>

      {openPanel === "zone" && (
        <CheckboxPanel
          options={ZONE_OPTIONS}
          selected={selectedZones}
          onToggle={(value) => toggleMultiValue("zone", value)}
          onSelectAll={() => navigate({ zone: null })}
        />
      )}
      {openPanel === "category" && (
        <CheckboxPanel
          options={CATEGORY_OPTIONS}
          selected={selectedCategories}
          onToggle={(value) => toggleMultiValue("category", value)}
          onSelectAll={() => navigate({ category: null })}
        />
      )}
      {openPanel === "price_range" && (
        <CheckboxPanel
          options={PRICE_RANGES}
          selected={selectedPriceRanges}
          onToggle={(value) => toggleMultiValue("price_range", value)}
          onSelectAll={() => navigate({ price_range: null })}
        />
      )}
    </div>
  );
}

function PartnershipChip({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
        active
          ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-200"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      )}
    >
      <Gift className={cn("size-3.5", active ? "text-orange-600" : "text-gray-400")} />
      제휴 혜택
    </button>
  );
}

function FilterMenuButton({
  label,
  count,
  isOpen,
  onClick,
}: {
  label: string;
  count?: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={isOpen ? "secondary" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("rounded-full", !isOpen && !!count && "border-primary/40 text-primary")}
    >
      {label}
      {!!count && ` (${count})`}
      <ChevronDownIcon className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} />
    </Button>
  );
}

function CheckboxPanel({
  options,
  selected,
  onToggle,
  onSelectAll,
}: {
  options: readonly Option[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
      {onSelectAll && <FilterChip label="전체" checked={selected.length === 0} onCheckedChange={onSelectAll} />}
      {options.map((option) => (
        <FilterChip
          key={option.value}
          label={option.label}
          checked={selected.includes(option.value)}
          onCheckedChange={() => onToggle(option.value)}
        />
      ))}
    </div>
  );
}

function FilterChip({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCheckedChange}
      aria-pressed={checked}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
