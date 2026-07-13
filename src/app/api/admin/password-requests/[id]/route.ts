import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const existing = await prisma.passwordResetRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 문의입니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const status = (body as Record<string, unknown> | null)?.status;

  if (status !== "처리완료") {
    return NextResponse.json({ error: "status는 '처리완료'여야 합니다." }, { status: 400 });
  }

  const passwordRequest = await prisma.passwordResetRequest.update({
    where: { id },
    data: { status: "처리완료" },
  });

  return NextResponse.json({ request: passwordRequest });
}
