"use client";

import Link from "next/link";
import type { KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import type { RestaurantListItem } from "@/lib/restaurants";
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
}: {
  restaurants: RestaurantListItem[];
  favoriteIds: Set<string>;
  isLoggedIn: boolean;
  sort: SortValue;
  q?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (restaurants.length === 0) {
    return (
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
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
    }
  }

  return (
    <>
      <p className="py-2 text-xs text-muted-foreground">{restaurants.length}개의 식당</p>
      <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="relative">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => onSelect(restaurant.id)}
              onKeyDown={(event) => handleKeyDown(event, restaurant.id)}
              className={cn(
                "h-full cursor-pointer transition-colors hover:bg-muted/50",
                selectedId === restaurant.id && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <CardTitle className="pr-8">{restaurant.name}</CardTitle>
                <CardDescription>
                  {restaurant.zone} · {restaurant.category}
                  {restaurant.avgRating !== null && ` · ★${restaurant.avgRating.toFixed(1)}`}
                </CardDescription>
                {restaurant.isPartnershipActive && (
                  <CardAction className="mr-8">
                    <Badge variant="secondary">제휴</Badge>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {restaurant.minPrice.toLocaleString()}원~
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
