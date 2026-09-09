"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

// 시스템 브라우저에서 마운트되자마자 OAuth(POST)를 시작한다. 로그인이 끝나면
// callbackUrl(/mobile-auth-bridge)로 이동해 앱으로 돌아갈 교환 코드를 발급받는다.
// 첫 시도에서 팝업 차단 등으로 자동 실행이 막힐 수 있어 수동 버튼을 함께 렌더링한다.
export function MobileLoginRedirect({
  provider,
  callbackUrl,
}: {
  provider: "kakao" | "google";
  callbackUrl: string;
}) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void signIn(provider, { callbackUrl });
  }, [provider, callbackUrl]);

  return (
    <Button type="button" onClick={() => void signIn(provider, { callbackUrl })}>
      계속하기
    </Button>
  );
}
