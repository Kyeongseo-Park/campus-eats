"use client";

import { useEffect, useRef } from "react";

import { useKakaoLoader } from "@/hooks/use-kakao-loader";
import { SCHOOL_MAIN_GATE } from "@/lib/constants";
import type { RestaurantListItem } from "@/lib/types";
import { KakaoMapFallback } from "@/components/map/kakao-map-fallback";
import {
  RESTAURANT_MARKER,
  RESTAURANT_MARKER_SELECTED,
  USER_LOCATION_MARKER,
} from "@/components/map/map-markers";

interface RestaurantMapProps {
  restaurants: RestaurantListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export function RestaurantMap({
  restaurants,
  selectedId,
  onSelect,
  userLocation,
}: RestaurantMapProps) {
  const status = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, kakao.maps.Marker>>(new Map());
  const userMarkerRef = useRef<kakao.maps.Marker | null>(null);
  const hasCenteredOnUserRef = useRef(false);

  // 지도 초기화 (최초 1회, 학교 정문 좌표 기준)
  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) return;

    mapRef.current = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(
        SCHOOL_MAIN_GATE.latitude,
        SCHOOL_MAIN_GATE.longitude,
      ),
      level: 4,
    });
  }, [status]);

  // 내 위치 획득 시 최초 1회만 지도를 재중심 이동
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !userLocation) return;
    if (hasCenteredOnUserRef.current) return;

    mapRef.current.setCenter(
      new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude),
    );
    hasCenteredOnUserRef.current = true;
  }, [status, userLocation]);

  // 식당 마커 동기화 (필터링된 목록 + 선택 상태)
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const map = mapRef.current;

    const nextIds = new Set(restaurants.map((restaurant) => restaurant.id));
    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    restaurants.forEach((restaurant) => {
      const isSelected = restaurant.id === selectedId;
      const markerSpec = isSelected ? RESTAURANT_MARKER_SELECTED : RESTAURANT_MARKER;
      const image = new window.kakao.maps.MarkerImage(
        markerSpec.src,
        new window.kakao.maps.Size(markerSpec.width, markerSpec.height),
      );

      let marker = markersRef.current.get(restaurant.id);
      if (!marker) {
        marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude),
          map,
          image,
          title: restaurant.name,
          zIndex: isSelected ? 10 : 1,
        });
        window.kakao.maps.event.addListener(marker, "click", () => onSelect(restaurant.id));
        markersRef.current.set(restaurant.id, marker);
      } else {
        marker.setImage(image);
        marker.setZIndex(isSelected ? 10 : 1);
      }
    });
  }, [status, restaurants, selectedId, onSelect]);

  // 내 위치 마커 (권한 허용 시에만 노출)
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = null;

    if (!userLocation) return;

    userMarkerRef.current = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude),
      map: mapRef.current,
      image: new window.kakao.maps.MarkerImage(
        USER_LOCATION_MARKER.src,
        new window.kakao.maps.Size(USER_LOCATION_MARKER.width, USER_LOCATION_MARKER.height),
      ),
      zIndex: 20,
    });
  }, [status, userLocation]);

  // 언마운트 시 마커 정리
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      markers.clear();
      userMarkerRef.current?.setMap(null);
    };
  }, []);

  if (status === "missing-key" || status === "error") {
    return <KakaoMapFallback status={status} />;
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
