"use client";

import { useEffect, useState } from "react";

const SCRIPT_ID = "kakao-maps-sdk";

let loadPromise: Promise<void> | null = null;

// dapi.kakao.com/v2/maps/sdk.js 자체는 앱키/도메인이 잘못돼도 항상 200으로 로드된다.
// 도메인이 Kakao Developers 콘솔에 등록돼 있지 않으면 kakao.maps.load()의 콜백이 그냥 영원히
// 호출되지 않아(스크립트 load/error 이벤트는 이미 발생한 뒤라) 아무 에러 없이 빈 화면으로 멈춘다.
// 그래서 타임아웃을 별도로 둬서 이 경우도 error 상태로 드러나게 한다.
const LOAD_TIMEOUT_MS = 10000;

function loadKakaoMapsScript(appKey: string): Promise<void> {
  if (window.kakao?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Kakao Maps SDK 로드가 시간 초과됐습니다. 앱 키 또는 Kakao Developers 콘솔의 등록된 웹 도메인을 확인해주세요.",
        ),
      );
    }, LOAD_TIMEOUT_MS);

    const onLoad = () =>
      window.kakao.maps.load(() => {
        clearTimeout(timeoutId);
        resolve();
      });
    const onError = () => {
      clearTimeout(timeoutId);
      reject(new Error("Kakao Maps SDK 로드에 실패했습니다."));
    };

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return loadPromise;
}

export type KakaoLoaderStatus = "loading" | "ready" | "missing-key" | "error";

/** Loads the Kakao Maps JS SDK once and reports its readiness. */
export function useKakaoLoader(): KakaoLoaderStatus {
  const [status, setStatus] = useState<KakaoLoaderStatus>(() =>
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ? "loading" : "missing-key",
  );

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) return;

    let cancelled = false;
    loadKakaoMapsScript(appKey)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((error) => {
        console.error("[kakao-loader]", error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
