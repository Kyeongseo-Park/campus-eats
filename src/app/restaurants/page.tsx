import { Suspense } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RestaurantFilters } from "@/components/restaurant-filters";
import { searchRestaurants } from "@/lib/restaurants";
import type { PriceRangeValue, SortValue } from "@/lib/constants";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseMulti(value: string | string[] | undefined): string[] {
  const raw = firstParam(value);
  return raw ? raw.split(",").filter(Boolean) : [];
}

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const q = firstParam(sp.q) || undefined;
  const zones = parseMulti(sp.zone);
  const categories = parseMulti(sp.category);
  const priceRanges = parseMulti(sp.price_range) as PriceRangeValue[];
  const partnershipOnly = firstParam(sp.partnership_only) === "true";

  const sortRaw = firstParam(sp.sort);
  const sort = (sortRaw as SortValue) || "rating";

  const latRaw = firstParam(sp.lat);
  const lngRaw = firstParam(sp.lng);
  const lat = latRaw ? Number(latRaw) : NaN;
  const lng = lngRaw ? Number(lngRaw) : NaN;
  const origin = Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;

  const restaurants = await searchRestaurants({
    q,
    zones,
    categories,
    priceRanges,
    partnershipOnly,
    sort,
    origin,
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">식당 목록</h1>

      <Suspense>
        <RestaurantFilters />
      </Suspense>

      {restaurants.length === 0 ? (
        <p className="text-muted-foreground">
          {q ? "검색 결과가 없어요. 새로운 식당을 제보해보세요!" : "조건에 맞는 식당이 없어요."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardDescription>
                    {restaurant.zone} · {restaurant.category}
                    {restaurant.avgRating !== null && ` · ★${restaurant.avgRating.toFixed(1)}`}
                  </CardDescription>
                  {restaurant.isPartnershipActive && (
                    <CardAction>
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
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
