"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestaurantMap } from "@/components/restaurant-map";
import { RestaurantFilters } from "@/components/restaurant-filters";
import { RestaurantListPanel } from "@/components/restaurant-list-panel";
import { BottomSheet } from "@/components/bottom-sheet";
import { FavoriteButton } from "@/components/favorite-button";
import type { RestaurantListItem } from "@/lib/restaurants";
import type { SortValue } from "@/lib/constants";

export function MapExplorer({
  restaurants,
  currentUserId,
  favoriteIds,
  sort,
  q,
  filterQuery,
  initialSelectedId,
}: {
  restaurants: RestaurantListItem[];
  currentUserId: string | null;
  favoriteIds: string[];
  sort: SortValue;
  q?: string;
  /** 현재 필터 쿼리스트링(`selected` 제외) — 상세 페이지로 이동할 때 돌아올 URL을 만드는 데 쓴다. */
  filterQuery: string;
  /** `/restaurants/{id}`에서 닫기(X)로 돌아왔을 때 복원할 선택 상태 (URL의 `selected` 파라미터). */
  initialSelectedId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [sheetMode, setSheetMode] = useState<"list" | "detail">(initialSelectedId ? "detail" : "list");
  const [sheetExpanded, setSheetExpanded] = useState(!!initialSelectedId);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  // 필터 변경 등으로 선택했던 식당이 결과에서 사라지면 선택을 무효화한다(렌더 중 파생, effect 불필요).
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) ?? null,
    [restaurants, selectedId]
  );
  const effectiveSheetMode: "list" | "detail" = sheetMode === "detail" && selectedRestaurant ? "detail" : "list";

  function selectRestaurant(id: string) {
    setSelectedId(id);
    setSheetMode("detail");
    setSheetExpanded(true);
  }

  function handleCloseDetail() {
    setSheetMode("list");
    setSelectedId(null);
    setSheetExpanded(false);
  }

  return (
    <>
      <div className="absolute inset-0">
        <RestaurantMap
          restaurants={restaurants}
          selectedId={selectedRestaurant?.id ?? null}
          onMarkerClick={selectRestaurant}
          panOffsetPx={120}
        />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 p-3">
        <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-background/95 p-2 shadow-md backdrop-blur">
          {/* sheetMode가 바뀌면 리마운트되어 열려 있던 필터 패널이 자동으로 닫힌다. */}
          <Suspense>
            <RestaurantFilters key={effectiveSheetMode} />
          </Suspense>
        </div>
      </div>

      <BottomSheet
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
        heightVh={effectiveSheetMode === "detail" ? 46 : 82}
      >
        {effectiveSheetMode === "detail" && selectedRestaurant ? (
          <RestaurantDetailCard
            restaurant={selectedRestaurant}
            isFavorited={favoriteIdSet.has(selectedRestaurant.id)}
            isLoggedIn={!!currentUserId}
            sort={sort}
            filterQuery={filterQuery}
            onClose={handleCloseDetail}
          />
        ) : (
          <RestaurantListPanel
            restaurants={restaurants}
            favoriteIds={favoriteIdSet}
            isLoggedIn={!!currentUserId}
            sort={sort}
            q={q}
            selectedId={selectedRestaurant?.id ?? null}
            onSelect={selectRestaurant}
          />
        )}
      </BottomSheet>
    </>
  );
}

function RestaurantDetailCard({
  restaurant,
  isFavorited,
  isLoggedIn,
  sort,
  filterQuery,
  onClose,
}: {
  restaurant: RestaurantListItem;
  isFavorited: boolean;
  isLoggedIn: boolean;
  sort: SortValue;
  filterQuery: string;
  onClose: () => void;
}) {
  // 상세 페이지에서 X(닫기)를 누르면 현재 필터 + 이 식당이 선택된 상태 그대로 돌아오도록
  // 복귀 URL을 함께 넘긴다.
  const returnParams = new URLSearchParams(filterQuery);
  returnParams.set("selected", restaurant.id);
  const detailHref = `/restaurants/${restaurant.id}?from=${encodeURIComponent(`/?${returnParams.toString()}`)}`;

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{restaurant.name}</h2>
            {restaurant.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {restaurant.zone} · {restaurant.category}
            {restaurant.avgRating !== null && ` · ★${restaurant.avgRating.toFixed(1)}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {restaurant.minPrice.toLocaleString()}원~
            {sort === "distance" && ` · ${restaurant.distanceKm.toFixed(1)}km`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton restaurantId={restaurant.id} initialFavorited={isFavorited} isLoggedIn={isLoggedIn} />
          <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <Button nativeButton={false} render={<Link href={detailHref} />} className="mt-1 w-fit">
        상세보기
      </Button>
    </div>
  );
}
