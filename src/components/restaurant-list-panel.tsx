"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Gift, SearchX, Star } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { OpenStatusBadge } from "@/components/open-status-badge";
import type { RestaurantListItem } from "@/lib/restaurants";
import { SORT_OPTIONS, type SortValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RestaurantListPanel({
  restaurants,
  favoriteIds,
  isLoggedIn,
  sort,
  q,
  selectedId,
  onSelect,
  pending,
  startTransition,
}: {
  restaurants: RestaurantListItem[];
  favoriteIds: Set<string>;
  isLoggedIn: boolean;
  sort: SortValue;
  q?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  // 필터/정렬 변경으로 새 목록을 불러오는 중이면 목록 자리에 스켈레톤을 보여준다 (map-explorer 주입).
  pending?: boolean;
  startTransition?: React.TransitionStartFunction;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortPanelOpen, setSortPanelOpen] = useState(false);

  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "평점순";

  function pushUrl(url: string) {
    if (startTransition) startTransition(() => router.push(url));
    else router.push(url);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
    }
  }

  function handleSortSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    if (value === "distance" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          params.set("sort", "distance");
          params.set("lat", String(position.coords.latitude));
          params.set("lng", String(position.coords.longitude));
          pushUrl(`${pathname}?${params.toString()}`);
        },
        () => {
          // 권한 거부 시 좌표 없이 이동 → 서버가 학교 정문 좌표로 대체
          params.set("sort", "distance");
          pushUrl(`${pathname}?${params.toString()}`);
        }
      );
    } else {
      params.set("sort", value);
      router.push(`${pathname}?${params.toString()}`);
    }
    setSortPanelOpen(false);
  }

  const partnershipOnly = searchParams.get("partnership_only") === "true";

  function handlePartnershipToggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (partnershipOnly) params.delete("partnership_only");
    else params.set("partnership_only", "true");
    router.push(`${pathname}?${params.toString()}`);
  }

  const header = (
    <div className="sticky top-0 z-10 flex flex-col gap-2 bg-background py-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant={sortPanelOpen ? "secondary" : "outline"}
          size="sm"
          onClick={() => setSortPanelOpen((prev) => !prev)}
          className="rounded-full"
        >
          정렬: {currentSortLabel}
          <ChevronDown className={cn("size-3.5 transition-transform", sortPanelOpen && "rotate-180")} />
        </Button>
        <PartnershipChip active={partnershipOnly} onClick={handlePartnershipToggle} />
      </div>
      {sortPanelOpen && (
        <div className="flex flex-wrap gap-1.5 rounded-md border border-border/60 bg-muted/20 p-3">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={sort === option.value ? "default" : "outline"}
              onClick={() => handleSortSelect(option.value)}
              className="rounded-full"
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  if (pending) {
    return (
      <>
        {header}
        <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border p-4 shadow-sm ring-1 ring-black/5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (restaurants.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={SearchX}
          title={q ? "검색 결과가 없어요" : "조건에 맞는 식당이 없어요"}
          description={
            q ? (
              <>
                다른 검색어로 찾아보거나, 새로운{" "}
                <Link href="/restaurant-requests/new" className="text-primary underline-offset-4 hover:underline">
                  식당을 제보해보세요!
                </Link>
              </>
            ) : (
              "필터 조건을 바꾸거나 초기화해보세요."
            )
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="relative">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => onSelect(restaurant.id)}
              onKeyDown={(event) => handleKeyDown(event, restaurant.id)}
              className={cn(
                "h-full cursor-pointer rounded-md shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md",
                selectedId === restaurant.id && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <CardTitle className="pr-8">{restaurant.name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-1.5">
                  <span className="font-medium text-primary">{restaurant.category}</span>
                  <span>· {restaurant.zone}</span>
                  {restaurant.avgRating !== null && (
                    <span className="ml-auto flex items-center gap-0.5 font-semibold text-foreground">
                      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                      {restaurant.avgRating.toFixed(1)}
                      <span className="font-normal text-muted-foreground">({restaurant.reviewCount})</span>
                    </span>
                  )}
                </CardDescription>
                <CardAction className="mr-8 flex gap-1">
                  {restaurant.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
                  <OpenStatusBadge status={restaurant.openStatus} />
                </CardAction>
              </CardHeader>
              {sort === "distance" && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{restaurant.distanceKm.toFixed(1)}km</p>
                </CardContent>
              )}
            </Card>
            <div className="absolute right-2 top-2">
              <FavoriteButton
                restaurantId={restaurant.id}
                initialFavorited={favoriteIds.has(restaurant.id)}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// 시트 헤더 우측의 제휴 혜택 토글 (구 restaurant-filters.tsx에서 이동). 눌릴 때마다 제휴 매장만
// 보이는 조건이 켜지고/꺼지고, 목록이 그 즉시 다시 필터링된다.
function PartnershipChip({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:outline-none sm:text-sm",
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
