import { NextRequest, NextResponse } from "next/server";

import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/session";
import type { SafeUser } from "@/lib/types";

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  };
}

/** 세션 쿠키를 검증해 현재 로그인한 사용자를 조회한다. 없거나 유효하지 않으면 null. */
export async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

/** 관리자 전용 API 라우트 가드. 통과 시 user를, 실패 시 곧바로 반환할 응답(401/403)을 준다. */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: User; response?: undefined } | { user?: undefined; response: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { response: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };
  }
  return { user };
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME);
}
