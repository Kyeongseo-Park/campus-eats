import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie, toSafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  nickname: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해주세요.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
});

export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password, nickname } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, nickname } });

  const response = NextResponse.json({ user: toSafeUser(user) }, { status: 201 });
  setSessionCookie(response, user.id);
  return response;
}
