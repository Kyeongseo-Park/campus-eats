"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

import { SCHOOL_MAIN_GATE } from "@/lib/constants";

export function KakaoMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  useEffect(() => {
    if (!isSdkReady) return;

    window.kakao.maps.load(() => {
      if (!containerRef.current) return;

      const center = new window.kakao.maps.LatLng(
        SCHOOL_MAIN_GATE.latitude,
        SCHOOL_MAIN_GATE.longitude
      );
      const map = new window.kakao.maps.Map(containerRef.current, { center, level: 4 });

      const showMyLocation = (lat: number, lng: number) => {
        const position = new window.kakao.maps.LatLng(lat, lng);
        map.setCenter(position);
        new window.kakao.maps.Marker({ position, map });
      };

      // 위치 권한이 없거나 실패하면 학교 정문 좌표를 기준으로 유지한다 (PRD 6.1).
      navigator.geolocation?.getCurrentPosition((pos) =>
        showMyLocation(pos.coords.latitude, pos.coords.longitude)
      );
    });
  }, [isSdkReady]);

  if (!appKey) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border text-sm text-muted-foreground">
        지도를 표시하려면 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 필요합니다.
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onReady={() => setIsSdkReady(true)}
      />
      <div ref={containerRef} className="h-64 w-full rounded-lg" />
    </>
  );
}
