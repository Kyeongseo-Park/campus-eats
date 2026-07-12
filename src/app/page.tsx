"use client";

import { useEffect, useMemo, useState } from "react";

import { RestaurantBottomSheet } from "@/components/home/restaurant-bottom-sheet";
import { RestaurantMap } from "@/components/home/restaurant-map";
import { ZoneCategoryFilters } from "@/components/home/zone-category-filters";
import { useUserLocation } from "@/hooks/use-user-location";
import type { Category, Zone } from "@/lib/constants";
import type { RestaurantListItem } from "@/lib/types";

export default function HomePage() {
  const [zone, setZone] = useState<Zone | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const location = useUserLocation();
  const userLocation = location.status === "granted" ? location.coords : null;

  useEffect(() => {
    const params = new URLSearchParams();
    if (zone) params.set("zone", zone);
    if (category) params.set("category", category);
    if (userLocation) {
      params.set("lat", String(userLocation.latitude));
      params.set("lng", String(userLocation.longitude));
    }

    const controller = new AbortController();
    fetch(`/api/kakao/restaurants?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { restaurants: RestaurantListItem[] }) => {
        setRestaurants(data.restaurants);
        setSelectedId((current) =>
          current && data.restaurants.some((r) => r.id === current) ? current : null,
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, [zone, category, userLocation]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId) ?? null,
    [restaurants, selectedId],
  );

  const filterSummary = useMemo(() => {
    const labels = [zone, category].filter((v): v is Zone | Category => Boolean(v));
    if (labels.length === 0) return null;
    return `✓ ${labels.map((l) => `'${l}'`).join(", ")} 식당 (총 ${restaurants.length}곳)`;
  }, [zone, category, restaurants.length]);

  return (
    <div className="flex h-full flex-col">
      <ZoneCategoryFilters
        zone={zone}
        category={category}
        onZoneChange={setZone}
        onCategoryChange={setCategory}
      />
      {filterSummary && (
        <p className="shrink-0 border-b px-3 py-2 text-sm text-muted-foreground">
          {filterSummary}
        </p>
      )}
      <div className="relative min-h-0 flex-1">
        <RestaurantMap
          restaurants={restaurants}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userLocation={userLocation}
        />
        {selectedRestaurant && (
          <RestaurantBottomSheet
            restaurant={selectedRestaurant}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
