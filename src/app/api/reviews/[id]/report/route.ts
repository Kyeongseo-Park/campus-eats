import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "신고 사유를 입력해주세요." }, { status: 400 });
  }

  const review = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!review) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }

  const existing = await prisma.report.findUnique({
    where: { userId_reviewId: { userId: user.id, reviewId: id } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 신고한 리뷰입니다." }, { status: 409 });
  }

  await prisma.report.create({
    data: { userId: user.id, reviewId: id, reason },
  });

  return NextResponse.json({ reported: true }, { status: 201 });
}
