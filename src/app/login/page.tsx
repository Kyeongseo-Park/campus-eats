import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/next-auth";

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
          <div className="flex flex-col gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("kakao", { redirectTo: callbackUrl });
              }}
            >
              <Button type="submit" className="w-full">
                카카오로 시작하기
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: callbackUrl });
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                구글로 시작하기
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
