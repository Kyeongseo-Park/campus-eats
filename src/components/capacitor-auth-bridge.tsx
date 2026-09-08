"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

// 앱 전역(RootLayout)에 마운트해두는 컴포넌트. 시스템 브라우저에서 로그인을 마치고
// campuseats://auth-callback 딥링크로 앱에 돌아오면, 그 안의 일회용 코드를
// /api/auth/callback/mobile-exchange로 교환해 이 웹뷰 쪽에도 세션 쿠키를 심는다.
export function CapacitorAuthBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | undefined;

    import("@capacitor/app").then(({ App }) => {
      const listenerPromise = App.addListener("appUrlOpen", async ({ url }) => {
        let parsed: URL;
        try {
          parsed = new URL(url);
        } catch {
          return;
        }
        if (parsed.protocol !== "campuseats:" || parsed.hostname !== "auth-callback") return;

        const code = parsed.searchParams.get("code");
        const rawReturnTo = parsed.searchParams.get("returnTo");
        const returnTo = rawReturnTo && rawReturnTo.startsWith("/") ? rawReturnTo : "/";
        if (!code) return;

        // 딥링크로 앱에 복귀했으면 OAuth는 이미 끝났다. 뒤에 남아 있는 시스템 브라우저를
        // 닫는다 — 특히 iOS(SFSafariViewController)는 딥링크만으로는 자동으로 닫히지 않는다.
        // (Android Custom Tabs / 웹에서는 no-op이거나 무해)
        Browser.close().catch(() => {});

        const result = await signIn("mobile-exchange", { code, redirect: false });
        if (result?.ok) {
          router.push(returnTo);
          router.refresh();
        } else {
          toast.error("로그인에 실패했어요. 다시 시도해주세요.");
        }
      });

      removeListener = () => {
        listenerPromise.then((handle) => handle.remove());
      };
    });

    return () => {
      removeListener?.();
    };
  }, [router]);

  return null;
}
