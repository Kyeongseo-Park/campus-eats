import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";

  if (!email || !password || !nickname) {
    return NextResponse.json(
      { error: "이메일, 비밀번호, 닉네임을 모두 입력해주세요." },
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
  try {
    user = await prisma.user.create({
      data: { email, passwordHash, nickname },
      select: { id: true, email: true, nickname: true, role: true },
    });
  } catch (err) {
    // 두 요청이 거의 동시에 들어와 위 findUnique 체크를 함께 통과한 경우, DB의 email
    // unique 제약에서 걸린다 — 이 경우도 동일하게 "이미 가입된 이메일" 에러로 응답한다.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }
    throw err;
  }

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, user.id);

  return NextResponse.json({ user }, { status: 201 });
}
