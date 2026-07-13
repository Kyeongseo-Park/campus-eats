import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { priceRangeLabel } from "@/lib/format";
import { cacheKakaoRestaurant } from "@/lib/kakao-restaurant-cache";
import type { RestaurantListItem } from "@/lib/types";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantListItem }) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      onClick={() => cacheKakaoRestaurant(restaurant)}
      className="flex gap-3 border-b px-4 py-3 hover:bg-muted/50"
    >
      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ImageIcon className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{restaurant.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          카테고리: {restaurant.category}
          {restaurant.zone && ` | 위치: ${restaurant.zone}`}
        </p>
        <p className="text-sm text-muted-foreground">
          평점: ★ {restaurant.avgRating.toFixed(1)} | 가격: {priceRangeLabel(restaurant.minPrice)}
        </p>
      </div>
    </Link>
  );
}
