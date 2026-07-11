import { requireUser } from "@/lib/auth";

export default async function MyPage() {
  const user = await requireUser();

  return (
    <main className="flex flex-1 flex-col p-8">
      <h1 className="text-2xl font-semibold">마이페이지</h1>
      <p className="mt-2 text-muted-foreground">
        {user.nickname}님 ({user.email})
      </p>
    </main>
  );
}
