import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
  }

  const passwordRequest = await prisma.passwordResetRequest.create({
    data: { email },
  });

  return NextResponse.json({ request: passwordRequest }, { status: 201 });
}
