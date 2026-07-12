"use client";

import { useEffect, useState } from "react";

export type UserLocationStatus = "loading" | "granted" | "denied" | "unsupported";

export interface UserLocationState {
  status: UserLocationStatus;
  coords: { latitude: number; longitude: number } | null;
}

function isGeolocationSupported() {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * PRD_v2 12번: 거리순 정렬은 실시간 GPS 좌표를 기준으로 한다.
 * 권한이 거부되면 status가 "denied"가 되고, 호출부는 학교 정문 고정 좌표(SCHOOL_MAIN_GATE)로 대체한다.
 */
export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>(() => ({
    status: isGeolocationSupported() ? "loading" : "unsupported",
    coords: null,
  }));

  useEffect(() => {
    if (!isGeolocationSupported()) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      () => {
        setState({ status: "denied", coords: null });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return state;
}
