import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export type CurrentUser = {
  id: string;
  email: string;
  nickname: string;
  role: string;
};

// 로그인한 사용자 정보를 조회한다. 세션이 없거나 유효하지 않으면 null.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const userId = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nickname: true, role: true },
  });
}

// 서버 컴포넌트에서 사용: 미로그인 시 로그인 페이지로 리다이렉트한다.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// 서버 컴포넌트에서 사용: 관리자가 아니면 메인으로 리다이렉트한다.
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
