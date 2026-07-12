"use client";

import { RestaurantLocationMap } from "@/components/restaurants/detail/restaurant-location-map";
import { useUserLocation } from "@/hooks/use-user-location";
import { SCHOOL_MAIN_GATE } from "@/lib/constants";
import { distanceLabel } from "@/lib/format";
import { haversineDistanceKm } from "@/lib/geo";
import type { RestaurantDetail } from "@/lib/types";

export function LocationTab({ restaurant }: { restaurant: RestaurantDetail }) {
  const location = useUserLocation();
  const referenceCoords = location.coords ?? SCHOOL_MAIN_GATE;
  const distanceKm = haversineDistanceKm(referenceCoords, restaurant);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-1 p-4 text-sm">
        <p>📍 주소: {restaurant.address}</p>
        {restaurant.phone && <p>📞 전화: {restaurant.phone}</p>}
        <p className="text-muted-foreground">
          🚶 {location.status === "granted" ? "내 위치에서" : "학교 정문 기준"} {distanceLabel(distanceKm)}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        <RestaurantLocationMap restaurant={restaurant} />
      </div>
    </div>
  );
}
