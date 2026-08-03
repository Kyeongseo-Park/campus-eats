"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestaurantMap } from "@/components/restaurant-map";
import { RestaurantFilters } from "@/components/restaurant-filters";
import { RestaurantListPanel } from "@/components/restaurant-list-panel";
import { RestaurantDetailModal } from "@/components/restaurant-detail-modal";
import { BottomSheet } from "@/components/bottom-sheet";
import { FavoriteButton } from "@/components/favorite-button";
import { OpenStatusBadge } from "@/components/open-status-badge";
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
}: {
  restaurants: RestaurantListItem[];
  currentUserId: string | null;
  favoriteIds: string[];
  sort: SortValue;
  q?: string;
}) {
  // 지도 마커 클릭 → 바텀시트에 요약카드(previewId)를 보여준다. 그 카드의 "상세보기"를 누르거나
  // 목록에서 카드를 바로 클릭하면 modalId가 열려 RestaurantDetailModal이 뜬다(페이지 이동 없음).
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const listScrollRef = useRef<HTMLDivElement>(null);

  const previewRestaurant = useMemo(
    () => restaurants.find((r) => r.id === previewId) ?? null,
    [restaurants, previewId]
  );

  const highlightedId = modalId ?? previewId;

  function handleMarkerClick(id: string) {
    setPreviewId(id);
    setSheetExpanded(false);
  }

  return (
    <div className="relative h-full">
      <div className="px-3 pt-2" style={{ height: `${MAP_RESTING_VH}dvh` }}>
        <div className="h-full w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <RestaurantMap restaurants={restaurants} selectedId={highlightedId} onMarkerClick={handleMarkerClick} />
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 z-20 px-2 pb-2">
        <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-background/95 p-2 shadow-md backdrop-blur">
          {/* 요약카드 ↔ 목록 전환 시 리마운트되어 열려 있던 필터 패널이 자동으로 닫힌다. */}
          <Suspense>
            <RestaurantFilters key={previewId ? "preview" : "list"} />
          </Suspense>
        </div>
      </div>

      <BottomSheet
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
        restingOffsetVh={MAP_RESTING_VH}
        contentRef={listScrollRef}
      >
        {previewRestaurant ? (
          <RestaurantPreviewCard
            restaurant={previewRestaurant}
            isFavorited={favoriteIdSet.has(previewRestaurant.id)}
            isLoggedIn={!!currentUserId}
            sort={sort}
            onClose={() => setPreviewId(null)}
            onViewDetail={() => setModalId(previewRestaurant.id)}
          />
        ) : (
          <RestaurantListPanel
            restaurants={restaurants}
            favoriteIds={favoriteIdSet}
            isLoggedIn={!!currentUserId}
            sort={sort}
            q={q}
            selectedId={highlightedId}
            onSelect={setModalId}
          />
        )}
      </BottomSheet>

      <RestaurantDetailModal
        restaurantId={modalId}
        isLoggedIn={!!currentUserId}
        currentUserId={currentUserId}
        onClose={() => setModalId(null)}
      />
    </div>
  );
}

function RestaurantPreviewCard({
  restaurant,
  isFavorited,
  isLoggedIn,
  sort,
  onClose,
  onViewDetail,
}: {
  restaurant: RestaurantListItem;
  isFavorited: boolean;
  isLoggedIn: boolean;
  sort: SortValue;
  onClose: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{restaurant.name}</h2>
            {restaurant.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
            <OpenStatusBadge status={restaurant.openStatus} />
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
      {restaurant.menus.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {restaurant.menus.map((menu) => (
            <li key={menu.name} className="flex justify-between text-sm">
              <span>{menu.name}</span>
              <span className="text-muted-foreground">{menu.price.toLocaleString()}원</span>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" onClick={onViewDetail} className="mt-1 w-fit">
        상세보기
      </Button>
    </div>
  );
}
