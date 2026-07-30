import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Google from "next-auth/providers/google";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { generateNickname } from "@/lib/nickname";

const ACCOUNT_CREATE_RETRIES = 5;

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
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;
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
