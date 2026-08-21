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

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <SocialLoginButtons callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
