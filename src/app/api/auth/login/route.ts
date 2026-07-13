import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 일치하지 않습니다." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ user: toSafeUser(user) });
  setSessionCookie(response, user.id);
  return response;
}
