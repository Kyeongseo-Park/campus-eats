"use client";

import { useEffect, useState } from "react";

const VISITED_STORAGE_KEY = "ce_visited";
const SPLASH_DURATION_MS = 1400;

type Phase = "hidden" | "visible" | "fading";

export function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (localStorage.getItem(VISITED_STORAGE_KEY)) return;

    localStorage.setItem(VISITED_STORAGE_KEY, "1");
    const showTimer = setTimeout(() => setPhase("visible"), 0);
    const fadeTimer = setTimeout(() => setPhase("fading"), SPLASH_DURATION_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background text-center transition-opacity duration-300"
      style={{ opacity: phase === "fading" ? 0 : 1 }}
      onTransitionEnd={() => phase === "fading" && setPhase("hidden")}
      aria-hidden
    >
      <h1 className="text-heading font-semibold">학식 말고 뭐 먹지?</h1>
      <p className="max-w-xs text-muted-foreground">
        학교 주변 식당의 메뉴, 가격, 리뷰, 제휴이벤트를 한곳에서 확인하세요.
      </p>
    </div>
  );
}
