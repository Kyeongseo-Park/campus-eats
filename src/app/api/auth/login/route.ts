import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !isValid) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 일치하지 않습니다." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  setSessionCookie(cookieStore, user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role },
  });
}
