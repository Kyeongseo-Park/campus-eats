"use client";

import { useEffect, useRef } from "react";

import { KakaoMapFallback } from "@/components/map/kakao-map-fallback";
import { RESTAURANT_MARKER } from "@/components/map/map-markers";
import { useKakaoLoader } from "@/hooks/use-kakao-loader";
import type { RestaurantDetail } from "@/lib/types";

export function RestaurantLocationMap({ restaurant }: { restaurant: RestaurantDetail }) {
  const status = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const { latitude, longitude } = restaurant;

  useEffect(() => {
    if (status !== "ready" || !containerRef.current) return;

    const center = new window.kakao.maps.LatLng(latitude, longitude);
    const map = new window.kakao.maps.Map(containerRef.current, { center, level: 3 });
    const marker = new window.kakao.maps.Marker({
      position: center,
      map,
      image: new window.kakao.maps.MarkerImage(
        RESTAURANT_MARKER.src,
        new window.kakao.maps.Size(RESTAURANT_MARKER.width, RESTAURANT_MARKER.height),
      ),
    });

    return () => marker.setMap(null);
  }, [status, latitude, longitude]);

  if (status === "missing-key" || status === "error") {
    return <KakaoMapFallback status={status} />;
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
