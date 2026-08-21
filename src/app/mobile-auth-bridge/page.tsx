import { encode } from "next-auth/jwt";

import { auth, MOBILE_EXCHANGE_SALT, MOBILE_EXCHANGE_MAX_AGE_SECONDS } from "@/lib/next-auth";
import { AutoRedirect } from "@/components/auto-redirect";

// Capacitor 앱이 로그인 버튼을 누르면 시스템 브라우저(@capacitor/browser)로 이 사이트를
// 열어 카카오/구글 OAuth를 끝낸다. 그 OAuth 콜백이 최종적으로 도착하는 곳이 이 페이지다
// (시스템 브라우저 안, 세션 쿠키가 막 발급된 상태). 여기서 일회용 교환 코드를 만들어
// 커스텀 URL 스킴(campuseats://)으로 앱에 돌려보내면, 앱 안의 웹뷰가 그 코드를
// /api/auth/callback/mobile-exchange로 교환해서 웹뷰 쪽에도 세션을 심는다.
// 자세한 배경: docs/02_Development/NativeApp_Capacitor.md 5번 항목
export default async function MobileAuthBridgePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const rawReturnTo = sp.returnTo;
  const returnTo = typeof rawReturnTo === "string" && rawReturnTo.startsWith("/") ? rawReturnTo : "/";

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-semibold">로그인에 실패했어요</p>
        <p className="text-muted-foreground text-sm">앱으로 돌아가서 다시 시도해주세요.</p>
      </main>
    );
  }

  const code = await encode({
    token: { sub: userId, purpose: "mobile-exchange" },
    secret: process.env.AUTH_SECRET!,
    salt: MOBILE_EXCHANGE_SALT,
    maxAge: MOBILE_EXCHANGE_MAX_AGE_SECONDS,
  });

  const deepLink = `campuseats://auth-callback?code=${encodeURIComponent(code)}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold">로그인 완료! 앱으로 돌아가는 중...</p>
      <p className="text-muted-foreground text-sm">
        자동으로 돌아가지 않으면 아래 버튼을 눌러주세요.
      </p>
      <a
        href={deepLink}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
      >
        앱으로 돌아가기
      </a>
      <AutoRedirect href={deepLink} />
    </main>
  );
}
