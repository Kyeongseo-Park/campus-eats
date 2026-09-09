import { redirect } from "next/navigation";

import { MobileLoginRedirect } from "@/components/mobile-login-redirect";

const PROVIDERS = ["kakao", "google"] as const;

// Capacitor 앱(웹뷰)에서 로그인 버튼을 누르면 시스템 브라우저로 이 페이지를 연다.
// Auth.js v5는 GET /api/auth/signin/:provider 요청으로는 OAuth를 시작하지 않고
// 로그인 페이지를 렌더링(=우리 /login으로 리다이렉트)만 한다. 그래서 앱에서 바로
// 이 엔드포인트를 열면 "첫 탭은 아무 일도 안 일어나고 두 번째 탭부터 로그인"되는
// 문제가 있었다. 이 페이지는 브라우저에서 클라이언트 signIn()(POST)을 직접 호출해
// OAuth를 시작하고, 콜백을 /mobile-auth-bridge 로 보내 일회용 교환 코드를 받게 한다.
export default async function MobileLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const rawProvider = sp.provider;
  const provider = PROVIDERS.find((p) => p === rawProvider);
  if (!provider) redirect("/login");

  const rawReturnTo = sp.returnTo;
  const returnTo =
    typeof rawReturnTo === "string" && rawReturnTo.startsWith("/") ? rawReturnTo : "/";

  const callbackUrl = `/mobile-auth-bridge?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold">로그인 중...</p>
      <p className="text-muted-foreground text-sm">
        자동으로 진행되지 않으면 아래 버튼을 눌러주세요.
      </p>
      <MobileLoginRedirect provider={provider} callbackUrl={callbackUrl} />
    </main>
  );
}
