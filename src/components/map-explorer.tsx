"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { MapPin, Navigation, Pencil, Phone, Star, X } from "lucide-react";

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
import { cn } from "@/lib/utils";

// 목록 접기·펼치기에 따른 지도 영역 높이(%, 이 컴포넌트 루트 기준 — 헤더를 뺀 실제 사용
// 가능 높이라 dvh와 달리 헤더 높이·화면 크기에 관계없이 항상 정확하다). 바텀시트의 resting
// 위치도 항상 이 값과 같게 맞춰서(아래 mapHeightVh), 시트 상단이 지도 박스 바로 아래에
// 정확히 맞물리게 한다.
const MAP_RESTING_VH = 50; // 기본 크기 (목록 펼쳐짐)
// 목록 접힘: 카드 목록은 안 보이고 핸들+토글 줄만 딱 보일 만큼만 남긴다(그 이상 안 내려감).
const LIST_PEEK_VH = 13;
const MAP_HEIGHT_LIST_COLLAPSED_VH = 100 - LIST_PEEK_VH;

const CATEGORY_EMOJI: Record<string, string> = {
  한식: "🍱",
  중식: "🥡",
  일식: "🍣",
  양식: "🍝",
  분식: "🍢",
  카페: "☕",
  패스트푸드: "🍔",
  기타: "🍽️",
};

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
  // 요약카드의 "리뷰 작성" 버튼으로 상세 모달을 열었을 때만 true — 모달이 열리자마자
  // 리뷰 작성 폼이 펼쳐진 상태로 보이게 한다.
  const [openReviewFormOnOpen, setOpenReviewFormOnOpen] = useState(false);
  // "마지막으로 선택한 식당" — 지도 마커/목록 카드 강조 표시에 쓰인다. modalId/previewId와
  // 달리 요약카드나 상세 모달을 닫아도 초기화되지 않고, 다른 식당을 새로 선택했을 때만 바뀐다.
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  // 목록에서 식당을 선택했을 때만 지도가 그 식당 위치로 확대되도록 하는 별도 트리거.
  // 매번 새 객체를 만들어서 같은 식당을 연달아 선택해도 항상 다시 확대되게 한다.
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);

  // 드래그로 목록을 완전히 끝까지 펼치는 것은 listCollapsed와 별개(resting 위치와 무관하게
  // 항상 화면 전체를 덮는 임시 상태).
  const [listCollapsed, setListCollapsed] = useState(false);
  const [dragExpanded, setDragExpanded] = useState(false);

  const mapHeightVh = listCollapsed ? MAP_HEIGHT_LIST_COLLAPSED_VH : MAP_RESTING_VH;

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const listScrollRef = useRef<HTMLDivElement>(null);

  const previewRestaurant = useMemo(
    () => restaurants.find((r) => r.id === previewId) ?? null,
    [restaurants, previewId]
  );

  function handleMarkerClick(id: string) {
    setPreviewId(id);
    setSelectedRestaurantId(id);
    setDragExpanded(false);
    // 목록이 접혀 있으면 요약카드가 보일 공간이 없으므로 다시 펼쳐준다.
    setListCollapsed(false);
  }

  function handleListSelect(id: string) {
    setModalId(id);
    setOpenReviewFormOnOpen(false);
    setSelectedRestaurantId(id);
    setFocusRequest({ id });
  }

  function handleViewDetail(id: string) {
    setModalId(id);
    setOpenReviewFormOnOpen(false);
  }

  function handleWriteReview(id: string) {
    setModalId(id);
    setOpenReviewFormOnOpen(true);
  }

  return (
    <div className="relative h-full">
      <div
        className="px-3 pt-2 transition-[height] duration-200 ease-out"
        style={{ height: `${mapHeightVh}%` }}
      >
        <div className="h-full w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <RestaurantMap
            restaurants={restaurants}
            selectedId={selectedRestaurantId}
            onMarkerClick={handleMarkerClick}
            focusRequest={focusRequest}
          />
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
        expanded={dragExpanded}
        onExpandedChange={setDragExpanded}
        restingOffsetVh={mapHeightVh}
        contentRef={listScrollRef}
      >
        {previewRestaurant ? (
          <RestaurantPreviewCard
            restaurant={previewRestaurant}
            isFavorited={favoriteIdSet.has(previewRestaurant.id)}
            isLoggedIn={!!currentUserId}
            sort={sort}
            onClose={() => setPreviewId(null)}
            onViewDetail={() => handleViewDetail(previewRestaurant.id)}
            onWriteReview={() => handleWriteReview(previewRestaurant.id)}
          />
        ) : (
          <RestaurantListPanel
            restaurants={restaurants}
            favoriteIds={favoriteIdSet}
            isLoggedIn={!!currentUserId}
            sort={sort}
            q={q}
            selectedId={selectedRestaurantId}
            onSelect={handleListSelect}
            listCollapsed={listCollapsed}
            onToggleList={() => setListCollapsed((prev) => !prev)}
          />
        )}
      </BottomSheet>

      <RestaurantDetailModal
        restaurantId={modalId}
        isLoggedIn={!!currentUserId}
        currentUserId={currentUserId}
        openReviewForm={openReviewFormOnOpen}
        onClose={() => {
          setModalId(null);
          setOpenReviewFormOnOpen(false);
        }}
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
  onWriteReview,
}: {
  restaurant: RestaurantListItem;
  isFavorited: boolean;
  isLoggedIn: boolean;
  sort: SortValue;
  onClose: () => void;
  onViewDetail: () => void;
  onWriteReview: () => void;
}) {
  const actionButtonClassName = "h-10 flex-1 text-[13px]";

  return (
    // min-h는 태그·메뉴가 없는 식당도 버튼 줄(mt-auto)이 항상 같은 높이에 오도록 맞춘
    // 여유값이다 — 태그 2줄 + 대표메뉴 3개까지 있는 카드 기준으로 잡았다.
    <div className="flex min-h-[275px] flex-col gap-2 pt-1">
      <span className="inline-flex w-fit items-center gap-1 rounded-md bg-gray-100 px-2 py-[3px] text-xs font-bold text-gray-700">
        <span aria-hidden>{CATEGORY_EMOJI[restaurant.category] ?? "🍽️"}</span>
        {restaurant.category}
      </span>

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900">{restaurant.name}</h2>
          {restaurant.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
          <OpenStatusBadge status={restaurant.openStatus} />
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton restaurantId={restaurant.id} initialFavorited={isFavorited} isLoggedIn={isLoggedIn} />
          <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {restaurant.avgRating !== null ? (
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-primary text-primary" />
            <span className="font-bold text-gray-900">{restaurant.avgRating.toFixed(1)}</span>
            <span className="text-gray-500">(리뷰 {restaurant.reviewCount}개)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-gray-500">
            <Star className="size-3.5" />
            리뷰 없음
          </span>
        )}
        <span className="text-gray-200">|</span>
        <span className="flex items-center gap-1 font-medium text-gray-700">
          <MapPin className="size-3.5 text-primary" />
          {restaurant.zone}
        </span>
      </div>

      {restaurant.topTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {restaurant.topTags.map((label) => (
            <span
              key={label}
              className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600"
            >
              {label}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">첫 리뷰 작성자가 되어보세요! ✏️</p>
      )}

      <p className="text-sm text-muted-foreground">
        {formatMinPrice(restaurant.minPrice)}
        {sort === "distance" && ` · ${restaurant.distanceKm.toFixed(1)}km`}
      </p>

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

      <div className="mt-auto flex gap-1.5 pt-1">
        {restaurant.phone ? (
          <Button
            nativeButton={false}
            render={<a href={`tel:${restaurant.phone}`} />}
            variant="outline"
            className={cn(actionButtonClassName, "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200")}
          >
            <Phone className="size-3.5" />
            전화
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled
            className={cn(actionButtonClassName, "border-transparent bg-gray-100 text-gray-700")}
          >
            <Phone className="size-3.5" />
            전화
          </Button>
        )}
        <Button
          nativeButton={false}
          render={
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.latitude},${restaurant.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          variant="outline"
          className={cn(actionButtonClassName, "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200")}
        >
          <Navigation className="size-3.5" />
          길찾기
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onWriteReview}
          className={cn(actionButtonClassName, "border border-orange-300")}
        >
          <Pencil className="size-3.5" />
          리뷰 작성
        </Button>
        <Button type="button" onClick={onViewDetail} className={cn("h-10 flex-[1.5] text-[13px]")}>
          상세 정보 보기
        </Button>
      </div>
    </div>
  );
}
