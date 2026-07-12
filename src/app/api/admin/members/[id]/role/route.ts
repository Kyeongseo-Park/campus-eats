import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const role = body?.role === "admin" ? "admin" : body?.role === "user" ? "user" : null;
  if (!role) {
    return NextResponse.json({ error: "role은 'admin' 또는 'user'여야 합니다." }, { status: 400 });
  }

  if (id === currentUser.id) {
    return NextResponse.json({ error: "본인의 권한은 변경할 수 없습니다." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "존재하지 않는 회원입니다." }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true },
  });

  return NextResponse.json({ role: updated.role });
}
