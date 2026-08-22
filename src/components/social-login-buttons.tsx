"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

// 웹(브라우저)에서는 지금까지처럼 같은 화면(웹뷰/브라우저 탭) 안에서 OAuth를 진행한다.
// Capacitor 앱(웹뷰) 안에서는 구글이 임베디드 웹뷰의 OAuth 요청을 차단하고 카카오도
// 세션 유지가 불안정해서, 시스템 브라우저(@capacitor/browser)를 열어 그 안에서
// OAuth를 진행한 뒤 커스텀 URL 스킴으로 앱에 복귀시킨다.
export function SocialLoginButtons({ callbackUrl }: { callbackUrl: string }) {
  const [pending, setPending] = useState<"kakao" | "google" | null>(null);

  async function handleLogin(provider: "kakao" | "google") {
    if (pending) return;
    setPending(provider);
    try {
      if (Capacitor.isNativePlatform()) {
        const returnTo = encodeURIComponent(callbackUrl);
        const bridgeCallback = encodeURIComponent(`/mobile-auth-bridge?returnTo=${returnTo}`);
        const signInUrl = `${window.location.origin}/api/auth/signin/${provider}?callbackUrl=${bridgeCallback}`;
        await Browser.open({ url: signInUrl });
      } else {
        await signIn(provider, { callbackUrl });
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        className="w-full"
        disabled={pending !== null}
        onClick={() => handleLogin("kakao")}
      >
        카카오로 시작하기
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending !== null}
        onClick={() => handleLogin("google")}
      >
        구글로 시작하기
      </Button>
    </div>
  );
}
