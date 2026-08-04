"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import type { KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { OpenStatusBadge } from "@/components/open-status-badge";
import type { RestaurantListItem } from "@/lib/restaurants";
import { formatMinPrice } from "@/lib/format";
import type { SortValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RestaurantListPanel({
  restaurants,
  favoriteIds,
  isLoggedIn,
  sort,
  q,
  selectedId,
  onSelect,
  listCollapsed,
  onToggleList,
}: {
  restaurants: RestaurantListItem[];
  favoriteIds: Set<string>;
  isLoggedIn: boolean;
  sort: SortValue;
  q?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 목록을 접어 지도를 넓게 보는 상태인지 (기본값 false = 목록이 펼쳐진 상태). */
  listCollapsed: boolean;
  onToggleList: () => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
    }
  }

  const header = (
    <div className="flex items-center justify-between py-2">
      <p className="text-xs text-muted-foreground">{restaurants.length}개의 식당</p>
      <button
        type="button"
        onClick={onToggleList}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {listCollapsed ? "목록 펼치기" : "목록 접기"}
        {listCollapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
    </div>
  );

  if (restaurants.length === 0) {
    return (
      <>
        {header}
        <p className="py-6 text-center text-sm text-muted-foreground">
          {q ? (
            <>
              검색 결과가 없어요. 새로운{" "}
              <Link href="/restaurant-requests/new" className="text-primary underline-offset-4 hover:underline">
                식당을 제보해보세요!
              </Link>
            </>
          ) : (
            "조건에 맞는 식당이 없어요."
          )}
        </p>
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
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {formatMinPrice(restaurant.minPrice)}
                  {sort === "distance" && ` · ${restaurant.distanceKm.toFixed(1)}km`}
                </p>
              </CardContent>
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
