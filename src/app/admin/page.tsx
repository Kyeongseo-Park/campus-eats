import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  return (
    <main className="flex flex-1 flex-col p-8">
      <h1 className="text-2xl font-semibold">관리자 대시보드</h1>
      <p className="mt-2 text-muted-foreground">{user.nickname}님, 관리자 권한으로 접속했습니다.</p>
    </main>
  );
}
