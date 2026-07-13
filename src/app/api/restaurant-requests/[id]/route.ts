import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const existing = await prisma.restaurantRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 제보입니다." }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "본인이 등록한 제보만 취소할 수 있습니다." }, { status: 403 });
  }
  if (existing.status === "승인") {
    return NextResponse.json({ error: "승인된 제보는 삭제할 수 없습니다." }, { status: 400 });
  }

  await prisma.restaurantRequest.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
