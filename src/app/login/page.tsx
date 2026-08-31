import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLoginButtons } from "@/components/social-login-buttons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const rawCallbackUrl = sp.callbackUrl;
  const callbackUrl = typeof rawCallbackUrl === "string" && rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";
  // 소셜 로그인 콜백이 실패하면 next-auth가 ?error= 파라미터를 붙여 이 페이지로 되돌린다.
  const hasError = typeof sp.error === "string" && sp.error.length > 0;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                로그인에 실패했어요.
                <br />
                카카오 또는 구글 계정으로 다시 시도해주세요.
              </span>
            </div>
          )}
          <SocialLoginButtons callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
