import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { decode } from "next-auth/jwt";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { generateNickname } from "@/lib/nickname";

const ACCOUNT_CREATE_RETRIES = 5;

// Capacitor 앱(웹뷰)에서 시스템 브라우저로 로그인한 뒤 세션을 웹뷰 쪽으로 옮겨오기 위한
// 일회용 교환 코드 전용 provider.
// 세션 쿠키(session-token)와는 완전히 별도의 salt를 써서, 이 코드가 유출돼도
// 세션 쿠키 자체를 위조하는 데는 쓰일 수 없다.
export const MOBILE_EXCHANGE_SALT = "campuseats.mobile-exchange";
export const MOBILE_EXCHANGE_MAX_AGE_SECONDS = 60;

// 서버 인스턴스 생존 기간 동안만 유효한 best-effort 재사용 방지.
// (서버리스 환경에서 인스턴스가 여러 개거나 콜드스타트가 있으면 완벽히 막지는 못하지만,
// 코드 자체가 60초짜리라 노출 시간이 매우 짧다 — docs 5-4-1 참고)
const usedMobileExchangeCodes = new Map<string, number>();
function isMobileExchangeCodeReused(jti: string): boolean {
  const now = Date.now();
  for (const [key, expiresAt] of usedMobileExchangeCodes) {
    if (expiresAt < now) usedMobileExchangeCodes.delete(key);
  }
  if (usedMobileExchangeCodes.has(jti)) return true;
  usedMobileExchangeCodes.set(jti, now + MOBILE_EXCHANGE_MAX_AGE_SECONDS * 1000);
  return false;
}

// provider/providerAccountId로 기존 사용자를 찾거나, 없으면 새로 만든다.
// 최초 로그인 시 이메일/프로필 없이 generateNickname()만으로 회원가입된다.
async function findOrCreateUserId(provider: string, providerAccountId: string): Promise<string> {
  const existingAccount = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    select: { userId: true },
  });
  if (existingAccount) return existingAccount.userId;

  for (let attempt = 1; ; attempt++) {
    const nickname = generateNickname();
    try {
      const user = await prisma.user.create({
        data: { nickname, accounts: { create: { provider, providerAccountId } } },
        select: { id: true },
      });
      return user.id;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = err.meta?.target;
        const targetsNickname = Array.isArray(target) && target.includes("nickname");
        if (targetsNickname && attempt < ACCOUNT_CREATE_RETRIES) continue;
      }
      throw err;
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID,
      clientSecret: process.env.AUTH_KAKAO_SECRET,
      // 닉네임/프로필사진/이메일 등 개인정보 동의항목은 카카오 디벨로퍼스
      // 콘솔에서 전부 미사용으로 설정되어 있다 — 여기서도 고유 회원번호만 사용한다.
      profile(profile) {
        return { id: String(profile.id) };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // email/profile 스코프를 요청하지 않는다 — openid만 요청해 고유 식별자(sub)만 받는다.
      authorization: { params: { scope: "openid" } },
      profile(profile) {
        return { id: profile.sub };
      },
    }),
    Credentials({
      id: "mobile-exchange",
      name: "Mobile session exchange",
      credentials: { code: { type: "text" } },
      async authorize(credentials) {
        const code = typeof credentials?.code === "string" ? credentials.code : undefined;
        if (!code || !process.env.AUTH_SECRET) return null;

        try {
          const payload = await decode({
            token: code,
            secret: process.env.AUTH_SECRET,
            salt: MOBILE_EXCHANGE_SALT,
          });
          if (!payload?.sub || payload.purpose !== "mobile-exchange" || !payload.jti) return null;
          if (isMobileExchangeCodeReused(payload.jti)) return null;
          return { id: payload.sub };
        } catch {
          // 만료되었거나 위조된 코드
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;
      // mobile-exchange는 이미 존재하는 유저의 교환 코드를 검증해 user.id를 받아온
      // 것뿐이라, 카카오/구글처럼 Account 테이블 조회/생성을 다시 할 필요가 없다.
      if (account.provider === "mobile-exchange") return true;
      user.id = await findOrCreateUserId(account.provider, account.providerAccountId);
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, nickname: true, role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.nickname = dbUser.nickname;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // next-auth v5 beta의 Session["user"] 타입이 실제 런타임 형태와 어긋나 있어
      // 여기서만 명시적으로 캐스팅한다 (getCurrentUser가 사용하는 실제 계약은
      // src/lib/auth.ts의 CurrentUser 타입).
      const user = session.user as unknown as { id: string; nickname: string; role: string };
      if (token.userId && typeof token.userId === "string") {
        user.id = token.userId;
        user.nickname = token.nickname as string;
        user.role = token.role as string;
      }
      return session;
    },
  },
});
