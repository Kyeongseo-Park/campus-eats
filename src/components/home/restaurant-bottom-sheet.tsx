"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { priceRangeLabel } from "@/lib/format";
import { cacheKakaoRestaurant } from "@/lib/kakao-restaurant-cache";
import type { RestaurantListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RestaurantBottomSheetProps {
  restaurant: RestaurantListItem;
  onClose: () => void;
}

export function RestaurantBottomSheet({ restaurant, onClose }: RestaurantBottomSheetProps) {
  // 즐겨찾기 API/로그인 세션이 아직 없어 화면 상태로만 표시한다.
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="animate-in slide-in-from-bottom-4 absolute inset-x-0 bottom-0 z-10 rounded-t-2xl border-t bg-background p-4 shadow-lg duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{restaurant.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            카테고리: {restaurant.category}
            {restaurant.zone && ` | 위치: ${restaurant.zone}`}
          </p>
          <p className="text-sm text-muted-foreground">
            평점: ★ {restaurant.avgRating.toFixed(1)} | 가격: {priceRangeLabel(restaurant.minPrice)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-pressed={isFavorite}
            aria-label="찜하기"
            onClick={() => setIsFavorite((value) => !value)}
            className="rounded-full p-2 hover:bg-muted"
          >
            <Heart
              className={cn(
                "size-5",
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground",
              )}
            />
          </button>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      <Link
        href={`/restaurants/${restaurant.id}`}
        onClick={() => cacheKakaoRestaurant(restaurant)}
        className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full")}
      >
        상세 정보 보러가기 →
      </Link>
    </div>
  );
}
