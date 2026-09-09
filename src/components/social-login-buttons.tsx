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
        // Auth.js v5의 GET /api/auth/signin/:provider 는 OAuth를 시작하지 않고 로그인
        // 페이지만 렌더링해서, 앱에서 바로 열면 첫 탭이 먹지 않는다. 대신 /mobile-login
        // 페이지를 열어 브라우저 쪽에서 signIn()(POST)으로 OAuth를 시작하게 한다.
        const returnTo = encodeURIComponent(callbackUrl);
        const signInUrl = `${window.location.origin}/mobile-login?provider=${provider}&returnTo=${returnTo}`;
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
