"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";

import { DetailTabs, type DetailTab } from "@/components/restaurants/detail/detail-tabs";
import { LocationTab } from "@/components/restaurants/detail/location-tab";
import { MenuTab } from "@/components/restaurants/detail/menu-tab";
import { ReviewTab } from "@/components/restaurants/detail/review-tab";
import { readCachedKakaoRestaurant } from "@/lib/kakao-restaurant-cache";
import type { RestaurantDetail, ReviewWithAuthor } from "@/lib/types";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "not-found" | "loaded";

function isKakaoSourced(id: string) {
  return id.startsWith("kakao-");
}

async function loadReviews(restaurantId: string): Promise<ReviewWithAuthor[]> {
  const res = await fetch(`/api/restaurants/${restaurantId}/reviews`);
  const data: { reviews: ReviewWithAuthor[] } = await res.json();
  return data.reviews ?? [];
}

// 캐시 조회는 동기 작업이지만, 이펙트 안에서 setState를 직접 호출하지 않도록 fetch 계열과 동일하게
// 비동기 함수로 감싸 .then() 콜백에서 상태를 갱신한다.
async function loadCachedKakaoRestaurant(id: string): Promise<RestaurantDetail | null> {
  const cached = readCachedKakaoRestaurant(id);
  return cached ? { ...cached, phone: cached.phone ?? null, menus: [] } : null;
}

export function RestaurantDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const kakaoSourced = isKakaoSourced(id);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [tab, setTab] = useState<DetailTab>("메뉴");
  // 즐겨찾기 API/로그인 세션이 아직 없어 화면 상태로만 표시한다.
  const [isFavorite, setIsFavorite] = useState(false);

  const refreshReviews = useCallback(() => {
    if (kakaoSourced) return;
    loadReviews(id)
      .then(setReviews)
      .catch((error) => console.error(error));
  }, [id, kakaoSourced]);

  useEffect(() => {
    // 카카오 검색 결과(DB 미등록)는 목록/지도에서 클릭할 때 캐싱해둔 데이터를 그대로 쓴다.
    // DB에 없는 id라 /api/restaurants로 조회할 수 없고, 메뉴·리뷰도 아직 없다.
    if (kakaoSourced) {
      loadCachedKakaoRestaurant(id).then((cached) => {
        if (!cached) {
          setLoadState("not-found");
          return;
        }
        setRestaurant(cached);
        setReviews([]);
        setLoadState("loaded");
      });
      return;
    }

    const controller = new AbortController();

    fetch(`/api/restaurants/${id}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 404) {
          setLoadState("not-found");
          return;
        }
        const data: { restaurant: RestaurantDetail } = await res.json();
        setRestaurant(data.restaurant);
        setLoadState("loaded");
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    loadReviews(id)
      .then(setReviews)
      .catch((error) => console.error(error));

    return () => controller.abort();
  }, [id, kakaoSourced]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 뒤로가기
        </button>
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label="찜하기"
          onClick={() => setIsFavorite((value) => !value)}
          className="rounded-full p-1.5 hover:bg-muted"
        >
          <Heart
            className={cn(
              "size-5",
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground",
            )}
          />
        </button>
      </header>

      {loadState === "loading" && (
        <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
      )}

      {loadState === "not-found" && (
        <p className="p-10 text-center text-sm text-muted-foreground">
          {kakaoSourced
            ? "식당 정보를 찾을 수 없어요. 목록에서 다시 선택해주세요."
            : "존재하지 않는 식당입니다."}
        </p>
      )}

      {loadState === "loaded" && restaurant && (
        <>
          <div className="shrink-0 border-b px-4 py-3">
            <p className="text-lg font-semibold">{restaurant.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              카테고리: {restaurant.category}
              {restaurant.zone && ` | 위치: ${restaurant.zone}`}
            </p>
            {kakaoSourced && (
              <p className="mt-1 text-xs text-muted-foreground">
                카카오맵에서 가져온 정보예요. 메뉴·리뷰는 CampusEats에 정식 등록되면 볼 수 있어요.
              </p>
            )}
          </div>

          <DetailTabs value={tab} onChange={setTab} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "메뉴" && <MenuTab menus={restaurant.menus} />}
            {tab === "리뷰" && (
              <ReviewTab
                restaurantId={restaurant.id}
                reviews={reviews}
                onReviewCreated={refreshReviews}
                writable={!kakaoSourced}
              />
            )}
            {tab === "위치" && <LocationTab restaurant={restaurant} />}
          </div>
        </>
      )}
    </div>
  );
}
