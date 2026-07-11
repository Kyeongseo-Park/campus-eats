"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, PRICE_RANGES, SORT_OPTIONS, ZONES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };
type FilterKey = "zone" | "category" | "price_range" | "sort";

const ZONE_OPTIONS: Option[] = ZONES.map((zone) => ({ value: zone, label: zone }));
const CATEGORY_OPTIONS: Option[] = CATEGORIES.map((category) => ({ value: category, label: category }));

function parseMulti(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function RestaurantFilters() {
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
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: qInput });
  }

  function handleSortSelect(value: string) {
    if (value === "distance" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          navigate({
            sort: "distance",
            lat: String(position.coords.latitude),
            lng: String(position.coords.longitude),
          });
        },
        () => navigate({ sort: "distance", lat: null, lng: null }) // 권한 거부 시 좌표 없이 이동 → 서버가 학교 정문 좌표로 대체
      );
    } else {
      navigate({ sort: value, lat: null, lng: null });
    }
    setOpenPanel(null);
  }

  const selectedZones = parseMulti(searchParams.get("zone"));
  const selectedCategories = parseMulti(searchParams.get("category"));
  const selectedPriceRanges = parseMulti(searchParams.get("price_range"));
  const currentSort = searchParams.get("sort") ?? "rating";
  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === currentSort)?.label ?? "평점순";
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
        <FilterMenuButton
          label={`정렬: ${currentSortLabel}`}
          isOpen={openPanel === "sort"}
          onClick={() => togglePanel("sort")}
        />

        <Label className="ml-2 flex items-center gap-1.5">
          <Checkbox
            checked={partnershipOnly}
            onCheckedChange={(checked) => navigate({ partnership_only: checked ? "true" : null })}
          />
          제휴이벤트 중인 식당만 보기
        </Label>
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
      {openPanel === "sort" && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border p-3">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={currentSort === option.value ? "default" : "outline"}
              onClick={() => handleSortSelect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
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
    <Button type="button" variant={isOpen ? "secondary" : "outline"} size="sm" onClick={onClick}>
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
    <div className="flex flex-wrap gap-3 rounded-lg border p-3">
      {onSelectAll && (
        <Label className="flex items-center gap-1.5">
          <Checkbox checked={selected.length === 0} onCheckedChange={onSelectAll} />
          전체
        </Label>
      )}
      {options.map((option) => (
        <Label key={option.value} className="flex items-center gap-1.5">
          <Checkbox checked={selected.includes(option.value)} onCheckedChange={() => onToggle(option.value)} />
          {option.label}
        </Label>
      ))}
    </div>
  );
}
