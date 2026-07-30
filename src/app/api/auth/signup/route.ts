import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateNickname } from "@/lib/nickname";
import { setSessionCookie } from "@/lib/session";

const NICKNAME_CREATE_RETRIES = 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "이메일, 비밀번호를 모두 입력해주세요." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  let user;
  for (let attempt = 1; ; attempt++) {
    const nickname = generateNickname();
    try {
      user = await prisma.user.create({
        data: { email, passwordHash, nickname },
        select: { id: true, email: true, nickname: true, role: true },
      });
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = err.meta?.target;
        const targetsNickname = Array.isArray(target) && target.includes("nickname");

        // 두 요청이 거의 동시에 들어와 위 findUnique 체크를 함께 통과한 경우, DB의 email
        // unique 제약에서 걸린다 — 이 경우도 동일하게 "이미 가입된 이메일" 에러로 응답한다.
        if (!targetsNickname) {
          return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
        }
        if (attempt < NICKNAME_CREATE_RETRIES) {
          continue;
        }
      }
      throw err;
    }
  }

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, user.id);

  return NextResponse.json({ user }, { status: 201 });
}
