"use client";

import { useState, type MouseEvent } from "react";
import Script from "next/script";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CATEGORY_SHARE_IMAGE } from "@/lib/constants";

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js";

// StaticStars(src/components/star-rating.tsx)와 동일한 기준(star <= rating)으로 채운다.
function buildStarsText(rating: number): string {
  return [1, 2, 3, 4, 5].map((star) => (star <= rating ? "★" : "☆")).join("");
}

export function ShareButton({
  title,
  path,
  category,
  avgRating,
  reviewCount,
  variant = "icon",
  label = "카카오톡으로 공유하기",
}: {
  title: string;
  path?: string;
  category: string;
  avgRating: number | null;
  reviewCount: number;
  /// "icon"(기본, 아이콘만) | "text"(텍스트 링크 — 룰렛 결과 화면 "결과 공유하기" 등에서 사용).
  variant?: "icon" | "text";
  label?: string;
}) {
  const [isSdkReady, setIsSdkReady] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  function handleShare(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!appKey || !isSdkReady) return;

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(appKey);
    }

    const url = path ? `${window.location.origin}${path}` : window.location.href;
    const link = { webUrl: url, mobileWebUrl: url };
    const description =
      avgRating !== null
        ? `${buildStarsText(avgRating)} ${avgRating.toFixed(1)} (${reviewCount})`
        : "아직 등록된 리뷰가 없어요.";

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}${CATEGORY_SHARE_IMAGE[category] ?? CATEGORY_SHARE_IMAGE.기타}`,
        imageWidth: 800,
        imageHeight: 400,
        link,
      },
      buttons: [{ title: "앱에서 보기", link }],
    });
  }

  return (
    <>
      {appKey && <Script src={KAKAO_SDK_SRC} strategy="afterInteractive" onReady={() => setIsSdkReady(true)} />}
      {variant === "text" ? (
        <Button
          type="button"
          variant="link"
          disabled={!appKey}
          title={appKey ? undefined : "카카오톡 공유를 사용하려면 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 필요합니다"}
          onClick={handleShare}
          className="gap-1.5 text-muted-foreground"
        >
          <Share2 className="size-3.5" />
          {label}
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="카카오톡으로 공유하기"
          disabled={!appKey}
          title={appKey ? undefined : "카카오톡 공유를 사용하려면 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 필요합니다"}
          onClick={handleShare}
        >
          <Share2 className="size-4" />
        </Button>
      )}
    </>
  );
}
