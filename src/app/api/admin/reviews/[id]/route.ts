import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 관리자 - 리뷰 관리: 삭제 (PRD_v2 9번).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }

  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
