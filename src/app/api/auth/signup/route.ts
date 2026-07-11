import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
  const user = await prisma.user.create({
    data: { email, passwordHash, nickname },
    select: { id: true, email: true, nickname: true, role: true },
  });

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, user.id);

  return NextResponse.json({ user }, { status: 201 });
}
