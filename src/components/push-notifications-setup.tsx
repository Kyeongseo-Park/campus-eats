"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useIsNativeApp } from "@/lib/native";
import { startPushNotifications } from "@/lib/native-push";

/**
 * 네이티브 앱에서 로그인한 사용자에게 푸시 알림 권한을 요청하고 기기 토큰을 등록한다.
 * 화면에 그리는 것은 없고, 앱 전체에 한 번만 붙이면 된다 (src/app/layout.tsx).
 *
 * 로그인한 뒤에 요청하는 이유: 토큰은 "누구의 기기인지"와 함께 저장해야 의미가 있고,
 * 로그인도 안 한 사용자에게 알림 권한부터 묻는 건 거부율만 높인다.
 */
export function PushNotificationsSetup({ isLoggedIn }: { isLoggedIn: boolean }) {
  const isNative = useIsNativeApp();
  const router = useRouter();

  useEffect(() => {
    if (!isNative || !isLoggedIn) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void startPushNotifications({
      onForegroundMessage: (title, body) => {
        toast(title, { description: body || undefined });
      },
      onNotificationTap: (url) => {
        router.push(url);
      },
    })
      .then((dispose) => {
        // 설정이 끝나기 전에 화면이 사라졌으면 곧바로 정리한다.
        if (cancelled) dispose();
        else cleanup = dispose;
      })
      .catch((error) => {
        console.warn("푸시 알림을 설정하지 못했습니다.", error);
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [isNative, isLoggedIn, router]);

  return null;
}
