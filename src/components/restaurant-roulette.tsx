"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Coins, Lock, MapPin, RotateCcw, Sparkles, Star, Utensils } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OpenStatusBadge } from "@/components/open-status-badge";
import { ShareButton } from "@/components/share-button";
import { CATEGORY_OPTIONS, type Option, ZONE_OPTIONS } from "@/components/restaurant-filters";
import { CATEGORY_EMOJI } from "@/components/map-explorer";
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_ROULETTE_MESSAGE, CATEGORY_SHARE_IMAGE, PRICE_RANGES, type PriceRangeValue } from "@/lib/constants";
import { formatMinPrice } from "@/lib/format";
import type { RestaurantListItem } from "@/lib/restaurants";
import { cn } from "@/lib/utils";

// 회전 연출 총 시간(3번 화면 스펙 "약 3초 남짓"). 3등분해서 회전 시작/가속/감속 단계 표시에 쓴다.
const ROLL_DURATION_MS = 3000;
// 휠이 멈춘 뒤 결과 화면으로 넘어가기 전 잠깐의 정지 시간.
const ROLL_PAUSE_MS = 400;

// 장식·게임용 미니 휠 팔레트 (디자인 시안 5번 표). 정보 전달용이 아니라 회전의 재미를 살리는 용도라
// CATEGORY_COLOR(카테고리 브랜드 컬러, src/lib/constants.ts)와는 별개로 이 컴포넌트 안에만 둔다.
const WHEEL_COLORS = ["#F97316", "#EC4899", "#8B5CF6", "#38BDF8", "#84CC16", "#FACC15", "#FB7185", "#14B8A6"];

// 필터 카드별 accent 컬러 (디자인 시안 5번 표).
const FILTER_ACCENTS = {
  zone: "#F97316",
  category: "#8B5CF6",
  price_range: "#65A30D",
} as const;

type FilterKey = keyof typeof FILTER_ACCENTS;

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

// 16진 hex 컬러에 알파를 덧붙여 반투명 틴트를 만든다(예: "#F97316" + "1A" → 약 10% 불투명도).
// 다크모드에서도 accent 컬러 값 자체는 그대로 쓰고 틴트만 반투명으로 대응한다(시안 7번 규칙).
function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}

// FAB / 헤더 / CTA 버튼에서 공통으로 쓰는 장식용 미니 컬러 휠. 8색 팔레트를 conic-gradient로
// 표현하고, 상단엔 고정 포인터를, 중앙엔 흰 원(옵션으로 포크·나이프 아이콘)을 얹는다.
function WheelIcon({
  size = 24,
  withUtensils = false,
  className,
}: {
  size?: number;
  withUtensils?: boolean;
  className?: string;
}) {
  const gradient = `conic-gradient(${WHEEL_COLORS.map(
    (color, i) => `${color} ${(i / WHEEL_COLORS.length) * 360}deg ${((i + 1) / WHEEL_COLORS.length) * 360}deg`
  ).join(", ")})`;

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full shadow-inner" style={{ backgroundImage: gradient }} />
      <span
        className="absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-transparent"
        style={{
          top: -size * 0.12,
          borderLeftWidth: size * 0.09,
          borderRightWidth: size * 0.09,
          borderBottomWidth: size * 0.14,
          borderBottomColor: "#EA580C",
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
        }}
      />
      {withUtensils ? (
        <span
          className="relative flex items-center justify-center rounded-full bg-white shadow-sm"
          style={{ width: size * 0.56, height: size * 0.56 }}
        >
          <Utensils className="text-gray-700" style={{ width: size * 0.32, height: size * 0.32 }} />
        </span>
      ) : (
        <span className="relative rounded-full bg-white" style={{ width: size * 0.32, height: size * 0.32 }} />
      )}
    </span>
  );
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
  const [resultId, setResultId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<FilterKey | null>(null);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<PriceRangeValue[]>([]);
  // 0=회전 시작, 1=가속, 2=감속 — 대기 문구 아래 진행 점 3개를 이 단계에 맞춰 옮긴다.
  const [rollPhase, setRollPhase] = useState(0);
  // 매 회전마다 누적으로 더해지는 각도. transition으로 감속 회전을 표현하고, 이전 결과에서 이어서
  // 더 돌기 때문에 "다시 뽑기"도 자연스럽게 이어서 돈다.
  const [wheelSpin, setWheelSpin] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  useEffect(() => clearTimers, []);

  function togglePanel(key: FilterKey) {
    setOpenPanel((prev) => (prev === key ? null : key));
  }

  function openSetup() {
    if (restaurants.length === 0) return;
    clearTimers();
    setOpen(true);
    setOpenPanel(null);
    setRolling(false);
    setRollPhase(0);
    setResultId(null);
  }

  function roll() {
    if (pool.length === 0) return;
    clearTimers();

    setRolling(true);
    setResultId(null);
    setRollPhase(0);

    // 휠이 이번 회전에서 처음 마운트되는 프레임엔 곧바로 최종 각도로 렌더링되므로(트랜지션이 탈
    // "이전 값"이 없음), 한 프레임 이상 지난 뒤에 각도를 바꿔야 실제로 도는 것처럼 보인다.
    // 최소 2바퀴 이상 돌고 임의의 각도에서 멈추도록 매번 더 큰 각도를 누적한다.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWheelSpin((prev) => prev + 720 + Math.floor(Math.random() * 360));
      });
    });

    const phaseStep = ROLL_DURATION_MS / 3;
    timersRef.current = [
      setTimeout(() => setRollPhase(1), phaseStep),
      setTimeout(() => setRollPhase(2), phaseStep * 2),
      setTimeout(() => {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setResultId(picked.id);
        setRolling(false);
      }, ROLL_DURATION_MS + ROLL_PAUSE_MS),
    ];
  }

  function handleClose() {
    clearTimers();
    setOpen(false);
    setOpenPanel(null);
    setRolling(false);
    setRollPhase(0);
    setResultId(null);
  }

  const shown = restaurants.find((r) => r.id === resultId) ?? null;
  const showSetup = !rolling && !resultId;

  return (
    <>
      {/* 결과 화면 등장 파티클(ConfettiBurst)에서 쓰는 keyframe. 컴포넌트 생애 동안 한 번만 넣어두고,
          재추첨마다 ConfettiBurst를 다시 마운트해서(key=resultId) 애니메이션만 재생시킨다. */}
      <style>{`
        @keyframes roulette-confetti-fall {
          0% { transform: translateY(-8px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(88px) rotate(200deg); opacity: 0; }
        }
      `}</style>
      <button
        type="button"
        onClick={openSetup}
        disabled={restaurants.length === 0}
        aria-label="랜덤 룰렛으로 식당 뽑기"
        title={restaurants.length === 0 ? "뽑을 식당이 없어요" : "랜덤 룰렛 돌리기"}
        className="absolute right-3 bottom-[72px] z-10 flex size-12 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-lg shadow-black/15 transition-transform duration-150 hover:-translate-y-px hover:scale-[1.03] active:scale-[0.94] disabled:pointer-events-none disabled:saturate-50 disabled:opacity-45 dark:border-gray-700 dark:bg-gray-800"
      >
        <WheelIcon size={36} withUtensils />
      </button>

      <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
        <DialogContent>
          {showSetup ? (
            <div className="relative overflow-hidden pr-9">
              <div className="pointer-events-none absolute -top-5 -right-3 opacity-60" aria-hidden>
                <WheelIcon size={52} />
                <span className="absolute -top-1 -left-3 size-1.5 rounded-full bg-pink-300" />
                <span className="absolute top-4 -left-5 size-1 rounded-full bg-purple-300" />
                <span className="absolute -bottom-1 left-1 size-1 rounded-full bg-orange-300" />
              </div>
              <div className="flex items-start gap-2.5">
                <WheelIcon size={30} withUtensils />
                <div className="min-w-0">
                  <DialogTitle className="text-base leading-snug font-bold">
                    룰렛 조건을 선택해주세요!
                  </DialogTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    원하는 조건을 선택하고 룰렛을 돌려보세요 🎯
                  </p>
                </div>
              </div>
            </div>
          ) : rolling ? (
            <div className="text-center">
              <DialogTitle className="text-lg font-bold">룰렛 돌리는 중...</DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground">맛있는 행운이 곧 결정돼요! 🎯</p>
            </div>
          ) : (
            <div className="text-center">
              <DialogTitle className="text-lg font-extrabold text-primary">축하해요!</DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground">맛있는 행운이 뽑혔어요 🎉</p>
            </div>
          )}

          {showSetup && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <FilterCard
                  icon={<MapPin className="size-4" />}
                  label="구역"
                  accent={FILTER_ACCENTS.zone}
                  count={selectedZones.length}
                  isOpen={openPanel === "zone"}
                  onClick={() => togglePanel("zone")}
                />
                {openPanel === "zone" && (
                  <AccentChipPanel
                    accent={FILTER_ACCENTS.zone}
                    options={ZONE_OPTIONS}
                    selected={selectedZones}
                    onToggle={(value) => setSelectedZones((prev) => toggleValue(prev, value))}
                    onSelectAll={() => setSelectedZones([])}
                  />
                )}

                <FilterCard
                  icon={<Utensils className="size-4" />}
                  label="카테고리"
                  accent={FILTER_ACCENTS.category}
                  count={selectedCategories.length}
                  isOpen={openPanel === "category"}
                  onClick={() => togglePanel("category")}
                />
                {openPanel === "category" && (
                  <AccentChipPanel
                    accent={FILTER_ACCENTS.category}
                    options={CATEGORY_OPTIONS}
                    selected={selectedCategories}
                    onToggle={(value) => setSelectedCategories((prev) => toggleValue(prev, value))}
                    onSelectAll={() => setSelectedCategories([])}
                  />
                )}

                <FilterCard
                  icon={<Coins className="size-4" />}
                  label="가격대"
                  accent={FILTER_ACCENTS.price_range}
                  count={selectedPriceRanges.length}
                  isOpen={openPanel === "price_range"}
                  onClick={() => togglePanel("price_range")}
                />
                {openPanel === "price_range" && (
                  <AccentChipPanel
                    accent={FILTER_ACCENTS.price_range}
                    options={PRICE_RANGES}
                    selected={selectedPriceRanges}
                    onToggle={(value) =>
                      setSelectedPriceRanges((prev) => toggleValue(prev, value as PriceRangeValue))
                    }
                    onSelectAll={() => setSelectedPriceRanges([])}
                  />
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-orange-300/70 bg-orange-50/70 px-4 py-3 text-center text-sm text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-300">
                <Sparkles className="size-4 shrink-0" />
                <span>
                  선택한 조건에 맞는 식당 <strong className="font-bold">{pool.length}곳</strong> 중에서 뽑아요!
                </span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <Button
                  type="button"
                  disabled={pool.length === 0}
                  onClick={roll}
                  className={cn(
                    "h-12 w-full gap-2 rounded-full text-base font-bold shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
                    pool.length > 0 &&
                      "bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 dark:from-orange-400 dark:to-orange-300"
                  )}
                >
                  <WheelIcon size={20} />
                  룰렛 돌리기
                </Button>
                <p className="text-xs text-muted-foreground">
                  {pool.length === 0 ? "ⓘ 조건에 맞는 식당이 없어요" : "조건을 선택하면 더 다양한 식당을 만날 수 있어요!"}
                </p>
              </div>
            </div>
          )}

          {rolling && (
            <div className="flex flex-col items-center gap-4 py-1">
              <SpinningWheel rotation={wheelSpin} />

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">잠시만 기다려주세요 😊</p>
                <div className="flex items-center gap-2" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        rollPhase === i ? "size-2.5 bg-orange-500" : "size-1.5 bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              </div>

              <SelectedFiltersSummary
                selectedZones={selectedZones}
                selectedCategories={selectedCategories}
                selectedPriceRanges={selectedPriceRanges}
              />

              <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                <Lock className="size-3.5 shrink-0" />
                공정하게 한 곳을 뽑고 있어요
              </div>
            </div>
          )}

          {!rolling && resultId && shown && (
            <div className="relative flex flex-col gap-3">
              <ConfettiBurst key={resultId} />

              <RouletteResultCard
                restaurant={shown}
                onClick={() => {
                  onViewDetail(shown.id);
                  handleClose();
                }}
              />

              <SelectedFiltersSummary
                selectedZones={selectedZones}
                selectedCategories={selectedCategories}
                selectedPriceRanges={selectedPriceRanges}
              />

              <div className="flex items-center gap-1.5 rounded-2xl border border-dashed border-orange-300/70 bg-orange-50/70 px-4 py-3 text-sm text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-300">
                <Sparkles className="size-4 shrink-0" />
                <span>{CATEGORY_ROULETTE_MESSAGE[shown.category] ?? "오늘은 이곳 어때요?"}</span>
              </div>

              <div className="flex gap-1.5">
                <Button type="button" variant="outline" className="flex-1" onClick={roll}>
                  <RotateCcw className="size-4" />
                  다시 뽑기
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    onFocusMap(shown.id);
                    handleClose();
                  }}
                >
                  <MapPin className="size-4" />
                  지도에서 보기
                </Button>
              </div>

              <div className="flex justify-center">
                <ShareButton
                  variant="text"
                  label="결과 공유하기"
                  title={shown.name}
                  path={`/restaurants/${shown.id}`}
                  category={shown.category}
                  avgRating={shown.avgRating}
                  reviewCount={shown.reviewCount}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// 구역/카테고리/가격대 필터 카드. 메인 화면의 RestaurantFilters(FilterMenuButton)와는 별개로,
// 룰렛 화면에서만 쓰는 accent 컬러 카드라 restaurant-filters.tsx는 건드리지 않는다.
function FilterCard({
  icon,
  label,
  accent,
  count,
  isOpen,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  accent: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className="flex w-full items-center gap-3 rounded-2xl border bg-card px-3.5 py-2.5 text-left transition-colors"
      style={{ borderColor: isOpen ? accent : undefined }}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: withAlpha(accent, "1A"), color: accent }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs font-medium" style={{ color: accent }}>
          {count > 0 ? `${count}개 선택됨` : "전체"}
        </span>
      </span>
      <ChevronDown
        className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
      />
    </button>
  );
}

// accent 컬러로 틴트된 배경 위에 "전체" + 옵션 칩을 나열하는 다중 선택 패널.
function AccentChipPanel({
  accent,
  options,
  selected,
  onToggle,
  onSelectAll,
}: {
  accent: string;
  options: readonly Option[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl p-3" style={{ backgroundColor: withAlpha(accent, "12") }}>
      <AccentChip label="전체" active={selected.length === 0} accent={accent} onClick={onSelectAll} />
      {options.map((option) => (
        <AccentChip
          key={option.value}
          label={option.label}
          active={selected.includes(option.value)}
          accent={accent}
          onClick={() => onToggle(option.value)}
        />
      ))}
    </div>
  );
}

function AccentChip({
  label,
  active,
  accent,
  onClick,
}: {
  label: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
      style={
        active
          ? { backgroundColor: accent, color: "#fff" }
          : { backgroundColor: "var(--background)", color: accent, border: `1px solid ${withAlpha(accent, "55")}` }
      }
    >
      {active && <Check className="size-3" />}
      {label}
    </button>
  );
}

const SPARKLE_POSITIONS = [
  { top: "-4%", left: "50%" },
  { top: "18%", left: "94%" },
  { top: "72%", left: "98%" },
  { top: "100%", left: "50%" },
  { top: "72%", left: "2%" },
  { top: "18%", left: "6%" },
];

// 실제로 도는 8분할 원판 (3번 화면 스펙). 카테고리 8개를 CATEGORY_EMOJI 순서 그대로 조각에 배치하고,
// rotation 값이 바뀔 때 CSS transition으로 감속 회전을 연출한다. 어떤 식당이 뽑혔는지와는 무관한
// 장식용 연출이라 실제 추첨(roll())과 결과는 별개 로직으로 결정된다.
function SpinningWheel({ rotation }: { rotation: number }) {
  const sliceDeg = 360 / CATEGORIES.length;
  const gradient = `conic-gradient(${WHEEL_COLORS.map(
    (color, i) => `${color} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`
  ).join(", ")})`;

  return (
    <div className="relative mx-auto size-[200px]" aria-hidden>
      {SPARKLE_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-orange-300"
          style={{ top: pos.top, left: pos.left, animationDelay: `${i * 0.2}s` }}
        />
      ))}

      <div
        className="absolute inset-0 rounded-full shadow-xl ring-4 ring-white dark:ring-gray-700"
        style={{
          backgroundImage: gradient,
          transform: `rotate(${rotation}deg)`,
          transition: "transform 3000ms cubic-bezier(0.12, 0.63, 0.15, 1)",
        }}
      >
        {CATEGORIES.map((category, i) => {
          const angle = sliceDeg * i + sliceDeg / 2;
          return (
            <span
              key={category}
              className="absolute top-1/2 left-1/2 text-xl"
              style={{ transform: `rotate(${angle}deg) translateY(-70px) rotate(${-angle}deg) translate(-50%, -50%)` }}
            >
              {CATEGORY_EMOJI[category] ?? "🍽️"}
            </span>
          );
        })}
      </div>

      <span
        className="absolute left-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 border-x-transparent"
        style={{ top: -4, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 14, borderBottomColor: "#EA580C" }}
      />

      <div className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl shadow-md dark:bg-gray-800">
        🎯
      </div>
    </div>
  );
}

// 회전 중/결과 화면에서 공통으로 쓰는 "선택한 조건" 요약 칩. 실제로 고른 필터만 표시하고,
// 하나도 안 골랐으면 영역 자체를 렌더링하지 않는다(시안 3·4번 화면 공통 규칙).
function SelectedFiltersSummary({
  selectedZones,
  selectedCategories,
  selectedPriceRanges,
}: {
  selectedZones: string[];
  selectedCategories: string[];
  selectedPriceRanges: PriceRangeValue[];
}) {
  const chips = [
    ...selectedZones.map((value) => ({ key: `zone-${value}`, label: value, accent: FILTER_ACCENTS.zone, icon: MapPin })),
    ...selectedCategories.map((value) => ({
      key: `category-${value}`,
      label: value,
      accent: FILTER_ACCENTS.category,
      icon: Utensils,
    })),
    ...selectedPriceRanges.map((value) => ({
      key: `price-${value}`,
      label: PRICE_RANGES.find((range) => range.value === value)?.label ?? value,
      accent: FILTER_ACCENTS.price_range,
      icon: Coins,
    })),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">선택한 조건</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {chips.map(({ key, label, accent, icon: Icon }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: withAlpha(accent, "1A"), color: accent }}
          >
            <Icon className="size-3" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// 결과 화면의 식당 카드 (4번 화면 스펙). 식당별 실사진 데이터가 없어서(RestaurantListItem에 image
// 필드 자체가 없음), 카카오 공유 카드용으로 이미 있는 카테고리 일러스트(CATEGORY_SHARE_IMAGE)를
// 대표 이미지 자리에 재사용한다. 카드 전체가 버튼이라 탭하면 상세보기로 이동한다.
function RouletteResultCard({ restaurant, onClick }: { restaurant: RestaurantListItem; onClick: () => void }) {
  const categoryColor = CATEGORY_COLOR[restaurant.category] ?? CATEGORY_COLOR.기타;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col overflow-hidden rounded-3xl border border-border text-left transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-[2/1] w-full bg-muted">
        <img
          src={CATEGORY_SHARE_IMAGE[restaurant.category] ?? CATEGORY_SHARE_IMAGE.기타}
          alt=""
          className="h-full w-full object-cover"
        />
        <span
          className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm"
          style={{ backgroundColor: categoryColor }}
        >
          {CATEGORY_EMOJI[restaurant.category] ?? "🍽️"} {restaurant.category}
        </span>
        {restaurant.avgRating !== null && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            {restaurant.avgRating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-lg font-extrabold tracking-tight text-foreground">{restaurant.name}</span>
          {restaurant.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-primary" />
            {restaurant.zone}
          </span>
          <span>{restaurant.distanceKm.toFixed(1)}km</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{formatMinPrice(restaurant.minPrice)}</Badge>
          {restaurant.reviewCount > 0 && <Badge variant="outline">리뷰 {restaurant.reviewCount}</Badge>}
          <OpenStatusBadge status={restaurant.openStatus} />
        </div>
      </div>
    </button>
  );
}

const CONFETTI_EMOJIS = ["🎉", "✨", "🎊", "⭐"];
const CONFETTI_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
  left: 6 + ((i * 41) % 88),
  delay: (i % 5) * 0.08,
  duration: 1.1 + (i % 4) * 0.15,
}));

// 결과 카드가 등장하는 순간 화면 위쪽에서 터지는 폭죽 파티클 (4번 화면 스펙). 라이브러리 없이
// CSS keyframe(roulette-confetti-fall, 이 컴포넌트 위쪽에서 한 번만 정의)만으로 구현했고,
// 부모가 key={resultId}로 감싸서 재추첨마다 새로 마운트되어 다시 재생된다.
function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-2 z-10 h-20 overflow-hidden" aria-hidden>
      {CONFETTI_PARTICLES.map((particle, i) => (
        <span
          key={i}
          className="absolute top-0 text-lg"
          style={{
            left: `${particle.left}%`,
            animation: `roulette-confetti-fall ${particle.duration}s ease-out ${particle.delay}s 1 both`,
          }}
        >
          {particle.emoji}
        </span>
      ))}
    </div>
  );
}
