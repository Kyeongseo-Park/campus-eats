"use client";

import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestaurantMap } from "@/components/restaurant-map";
import { RestaurantFilters } from "@/components/restaurant-filters";
import { RestaurantListPanel } from "@/components/restaurant-list-panel";
import { BottomSheet } from "@/components/bottom-sheet";
import { FavoriteButton } from "@/components/favorite-button";
import type { RestaurantListItem } from "@/lib/restaurants";
import { formatMinPrice } from "@/lib/format";
import type { SortValue } from "@/lib/constants";

// 바텀시트 기본(resting) 위치 — 지도 박스 높이와 동일한 값을 써서 시트 상단이 지도 박스 바로
// 아래에 정확히 맞물리게 한다(지도가 화면의 이 비율만큼 보인다).
const MAP_RESTING_VH = 50;

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
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  // 필터 변경 등으로 선택했던 식당이 결과에서 사라지면 선택을 무효화한다(렌더 중 파생, effect 불필요).
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) ?? null,
    [restaurants, selectedId]
  );
  const effectiveSheetMode: "list" | "detail" = sheetMode === "detail" && selectedRestaurant ? "detail" : "list";

  // 목록 → 요약카드 전환 시 목록 스크롤 위치를 저장했다가, 카드를 닫으면 그 위치로 되돌린다.
  const listScrollRef = useRef<HTMLDivElement>(null);
  const savedListScrollTopRef = useRef(0);

  useLayoutEffect(() => {
    if (effectiveSheetMode === "list" && listScrollRef.current) {
      listScrollRef.current.scrollTop = savedListScrollTopRef.current;
    }
  }, [effectiveSheetMode]);

  function selectRestaurant(id: string) {
    if (effectiveSheetMode === "list" && listScrollRef.current) {
      savedListScrollTopRef.current = listScrollRef.current.scrollTop;
    }
    setSelectedId(id);
    setSheetMode("detail");
    // 지도의 선택된 마커와 요약카드를 함께 볼 수 있도록 기본(resting) 위치로 되돌린다.
    setSheetExpanded(false);
  }

  function handleCloseDetail() {
    setSheetMode("list");
    setSelectedId(null);
  }

  return (
    <div className="relative h-full">
      <div className="px-3 pt-2" style={{ height: `${MAP_RESTING_VH}dvh` }}>
        <div className="h-full w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <RestaurantMap
            restaurants={restaurants}
            selectedId={selectedRestaurant?.id ?? null}
            onMarkerClick={selectRestaurant}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 z-20 px-2 pb-2">
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
        restingOffsetVh={MAP_RESTING_VH}
        contentRef={listScrollRef}
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
    </div>
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
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <span className="font-medium text-primary">{restaurant.category}</span>
            <span>· {restaurant.zone}</span>
            {restaurant.avgRating !== null && (
              <span className="flex items-center gap-0.5 font-semibold text-foreground">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                {restaurant.avgRating.toFixed(1)}
                <span className="font-normal text-muted-foreground">(리뷰 {restaurant.reviewCount}개)</span>
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatMinPrice(restaurant.minPrice)}
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
