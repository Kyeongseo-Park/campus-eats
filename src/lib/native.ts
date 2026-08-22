"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Capacitor 네이티브 앱(iOS/Android) 안에서 실행 중인지 판별한다.
 * 일반 웹 브라우저에서는 항상 false. 이벤트 핸들러 등 렌더링 밖에서 쓴다.
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// 네이티브 여부는 앱이 실행되는 동안 바뀌지 않으므로 구독할 것이 없다.
const subscribe = () => () => {};
const getSnapshot = () => Capacitor.isNativePlatform();
// 서버에는 Capacitor가 없으므로 항상 웹으로 렌더링한 뒤, 클라이언트에서 실제 값으로 맞춘다.
const getServerSnapshot = () => false;

/**
 * 렌더링 중에 네이티브 여부가 필요할 때 쓰는 훅.
 *
 * useEffect + setState 대신 useSyncExternalStore를 쓰는 이유:
 * 서버 렌더링 결과(웹)와 클라이언트 결과(네이티브)가 달라도 React가 하이드레이션을
 * 안전하게 처리해주고, 불필요한 연쇄 렌더링이 생기지 않는다.
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
