import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "campuseats_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7일

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET 환경변수가 설정되어 있지 않습니다.");
  return secret;
}

function sign(userId: string) {
  return createHmac("sha256", getSecret()).update(userId).digest("hex");
}

/** 세션 쿠키에 저장할 "userId.서명" 형태의 값을 만든다. */
export function createSessionToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

/** 쿠키 값의 서명을 검증하고, 유효하면 userId를 반환한다. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const expected = sign(userId);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  return userId;
}
