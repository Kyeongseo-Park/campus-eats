import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/change-password-form";
import { requireUser } from "@/lib/auth";

export default async function ChangePasswordPage() {
  await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-heading">비밀번호 변경</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
