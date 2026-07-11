import { createHmac, timingSafeEqual } from "crypto";
import type { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({
    sub: userId,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

// 서명과 만료 시각을 검증하고, 유효하면 userId를 반환한다.
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = Buffer.from(sign(encodedPayload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

// 로그인/회원가입 Route Handler에서 세션 쿠키를 발급할 때 사용한다.
export function setSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  userId: string
): void {
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
