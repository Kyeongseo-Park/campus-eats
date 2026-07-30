import { redirect } from "next/navigation";

import { auth } from "@/lib/next-auth";

export type CurrentUser = {
  id: string;
  nickname: string;
  role: string;
};

// 로그인한 사용자 정보를 조회한다. 세션이 없으면 null.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  // next-auth v5 beta의 Session["user"] 타입이 실제 런타임 형태(session 콜백에서
  // 채워 넣는 id/nickname/role)와 어긋나 있어 여기서 명시적으로 캐스팅한다.
  const user = session?.user as unknown as CurrentUser | undefined;
  if (!user?.id) return null;

  return { id: user.id, nickname: user.nickname, role: user.role };
}

// 서버 컴포넌트에서 사용: 미로그인 시 로그인 페이지로 리다이렉트한다.
// returnTo를 넘기면 로그인 성공 후 원래 있던 페이지로 돌아간다.
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?callbackUrl=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

// 서버 컴포넌트에서 사용: 관리자가 아니면 메인으로 리다이렉트한다.
export async function requireAdmin(returnTo?: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") redirect("/");
  return user;
}
