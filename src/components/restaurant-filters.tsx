"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, PRICE_RANGES, ZONES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };
type FilterKey = "zone" | "category" | "price_range";

export const ZONE_OPTIONS: Option[] = ZONES.map((zone) => ({ value: zone, label: zone }));
export const CATEGORY_OPTIONS: Option[] = CATEGORIES.map((category) => ({ value: category, label: category }));

function parseMulti(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function RestaurantFilters({
  onZoneChange,
  startTransition,
}: {
  onZoneChange?: (zones: string[]) => void;
  // 넘어오면 목록 네비게이션을 이 transition으로 감싸 목록 스켈레톤을 띄운다 (map-explorer에서 주입).
  startTransition?: React.TransitionStartFunction;
}) {
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
    const run = () => router.push(`${pathname}?${params.toString()}`);
    if (startTransition) startTransition(run);
    else run();
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
  // 초기화 버튼 노출 여부 판단에만 쓴다 — 제휴/영업중 토글 UI는 각각 하단 시트 헤더, (아직 없음)
  // 다른 곳에 있어서 이 컴포넌트에서 값을 직접 켜지는 않는다.
  const partnershipOnly = searchParams.get("partnership_only") === "true";
  const openNow = searchParams.get("open_now") === "true";
  const hasAnyFilter = selectedZones.length > 0 || selectedCategories.length > 0 || selectedPriceRanges.length > 0 || partnershipOnly || openNow;

  function handleReset() {
    navigate({ zone: null, category: null, price_range: null, partnership_only: null, open_now: null });
    onZoneChange?.([]);
  }

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

        {hasAnyFilter && <ResetFiltersButton onClick={handleReset} />}
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

// 구역/카테고리/가격대/제휴/영업중 중 하나라도 켜져 있을 때만 필터 버튼들 옆에 나타난다.
// 제휴·영업중 토글 UI는 이 컴포넌트가 아니라 하단 시트 헤더(제휴) 등 다른 곳에 있지만,
// 초기화는 이 화면의 검색 조건 전체(zone/category/price_range/partnership_only/open_now)를
// 한 번에 지운다(검색어 q는 대상이 아니다 — 시안 4번 규칙).
function ResetFiltersButton({ onClick }: { onClick: () => void }) {
  // 클릭할 때마다 아이콘을 remount해서 1회성 360도 회전 애니메이션을 다시 재생시킨다
  // (restaurant-roulette.tsx의 ConfettiBurst와 동일한 key remount 패턴).
  const [spinKey, setSpinKey] = useState(0);

  return (
    <>
      <style>{`@keyframes reset-filters-spin { to { transform: rotate(360deg); } }`}</style>
      <button
        type="button"
        onClick={() => {
          setSpinKey((prev) => prev + 1);
          onClick();
        }}
        className="flex h-7 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none"
      >
        <RefreshCw
          key={spinKey}
          className="size-3.5"
          style={spinKey > 0 ? { animation: "reset-filters-spin 0.35s ease-in-out" } : undefined}
        />
        초기화
      </button>
    </>
  );
}

export function FilterMenuButton({
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

export function CheckboxPanel({
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

export function FilterChip({
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
