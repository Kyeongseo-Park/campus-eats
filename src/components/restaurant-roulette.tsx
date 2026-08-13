"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dices, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OpenStatusBadge } from "@/components/open-status-badge";
import { CATEGORY_OPTIONS, CheckboxPanel, FilterMenuButton, ZONE_OPTIONS } from "@/components/restaurant-filters";
import { CATEGORY_EMOJI } from "@/components/map-explorer";
import { PRICE_RANGES, type PriceRangeValue } from "@/lib/constants";
import type { RestaurantListItem } from "@/lib/restaurants";
import { cn } from "@/lib/utils";

const ROLL_DURATION_MS = 1200;
const ROLL_TICK_MS = 90;

type FilterKey = "zone" | "category" | "price_range";

// 메인 화면 필터(RestaurantFilters)의 가격대 구간 판정과 동일한 기준 (src/lib/restaurants.ts
// priceRangeCondition 참고). 가격 정보가 없는 식당(null)은 어떤 구간에도 해당하지 않는다.
function matchesPriceRange(minPrice: number | null, value: PriceRangeValue): boolean {
  if (minPrice === null) return false;
  switch (value) {
    case "5000":
      return minPrice <= 5000;
    case "10000":
      return minPrice > 5000 && minPrice <= 10000;
    case "20000":
      return minPrice > 10000 && minPrice <= 20000;
    case "20000+":
      return minPrice > 20000;
  }
}

function toggleValue<T extends string>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

// 지도 우측 하단 FAB. 현재 필터링된 restaurants 목록 안에서, 메인 화면 필터와 동일한
// 구역/카테고리/가격대 조건으로 한 번 더 좁혀 랜덤으로 뽑는다(아무것도 안 고르면 전체 대상).
export function RestaurantRoulette({
  restaurants,
  onViewDetail,
  onFocusMap,
}: {
  restaurants: RestaurantListItem[];
  onViewDetail: (id: string) => void;
  onFocusMap: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [displayId, setDisplayId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<FilterKey | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<PriceRangeValue[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pool = useMemo(
    () =>
      restaurants.filter((r) => {
        if (selectedZones.length > 0 && !selectedZones.includes(r.zone)) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(r.category)) return false;
        if (selectedPriceRanges.length > 0 && !selectedPriceRanges.some((pr) => matchesPriceRange(r.minPrice, pr)))
          return false;
        return true;
      }),
    [restaurants, selectedZones, selectedCategories, selectedPriceRanges]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function togglePanel(key: FilterKey) {
    setOpenPanel((prev) => (prev === key ? null : key));
  }

  function openSetup() {
    if (restaurants.length === 0) return;
    setOpen(true);
    setOpenPanel(null);
    setRolling(false);
    setDisplayId(null);
    setResultId(null);
  }

  function roll() {
    if (pool.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setRolling(true);
    setResultId(null);

    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const picked = pool[Math.floor(Math.random() * pool.length)];
      setDisplayId(picked.id);

      if (Date.now() - startedAt >= ROLL_DURATION_MS) {
        if (timerRef.current) clearInterval(timerRef.current);
        setResultId(picked.id);
        setRolling(false);
      }
    }, ROLL_TICK_MS);
  }

  function handleClose() {
    if (timerRef.current) clearInterval(timerRef.current);
    setOpen(false);
    setOpenPanel(null);
    setRolling(false);
    setDisplayId(null);
    setResultId(null);
  }

  const shownId = resultId ?? displayId;
  const shown = restaurants.find((r) => r.id === shownId) ?? null;
  const showSetup = !rolling && !resultId;

  return (
    <>
      <Button
        type="button"
        onClick={openSetup}
        disabled={restaurants.length === 0}
        aria-label="랜덤 룰렛으로 식당 뽑기"
        title={restaurants.length === 0 ? "뽑을 식당이 없어요" : "랜덤 룰렛 돌리기"}
        className="absolute right-3 bottom-[72px] z-10 size-12 rounded-full shadow-lg"
        size="icon"
      >
        <Dices className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
        <DialogContent>
          <DialogTitle className="text-center">
            {showSetup ? "조건을 골라주세요" : rolling ? "룰렛 돌리는 중..." : "오늘은 여기 어때요?"}
          </DialogTitle>

          {showSetup && (
            <div className="flex flex-col gap-3">
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
              </div>

              {openPanel === "zone" && (
                <CheckboxPanel
                  options={ZONE_OPTIONS}
                  selected={selectedZones}
                  onToggle={(value) => setSelectedZones((prev) => toggleValue(prev, value))}
                  onSelectAll={() => setSelectedZones([])}
                />
              )}
              {openPanel === "category" && (
                <CheckboxPanel
                  options={CATEGORY_OPTIONS}
                  selected={selectedCategories}
                  onToggle={(value) => setSelectedCategories((prev) => toggleValue(prev, value))}
                  onSelectAll={() => setSelectedCategories([])}
                />
              )}
              {openPanel === "price_range" && (
                <CheckboxPanel
                  options={PRICE_RANGES}
                  selected={selectedPriceRanges}
                  onToggle={(value) =>
                    setSelectedPriceRanges((prev) => toggleValue(prev, value as PriceRangeValue))
                  }
                  onSelectAll={() => setSelectedPriceRanges([])}
                />
              )}

              <p className="text-xs text-muted-foreground">이 조건에 맞는 식당 {pool.length}곳 중에서 뽑아요.</p>
              <Button type="button" className="w-full" disabled={pool.length < 2} onClick={roll}>
                <Dices className="size-4" />
                룰렛 돌리기
              </Button>
            </div>
          )}

          {shown && (
            <div
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-5 text-center transition-opacity",
                rolling && "opacity-70"
              )}
            >
              <span className="text-3xl" aria-hidden>
                {CATEGORY_EMOJI[shown.category] ?? "🍽️"}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-gray-900">{shown.name}</span>
                {shown.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" />
                  {shown.zone}
                </span>
                {shown.avgRating !== null && (
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-primary text-primary" />
                    <span className="font-bold text-gray-900">{shown.avgRating.toFixed(1)}</span>
                  </span>
                )}
                <OpenStatusBadge status={shown.openStatus} />
              </div>
            </div>
          )}

          {!rolling && resultId && (
            <div className="flex flex-col gap-1.5">
              <Button type="button" variant="outline" className="w-full" onClick={roll}>
                다시 뽑기
              </Button>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onFocusMap(resultId);
                    handleClose();
                  }}
                >
                  지도에서 보기
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    onViewDetail(resultId);
                    handleClose();
                  }}
                >
                  상세보기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
