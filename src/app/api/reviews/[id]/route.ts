import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseRating(value: unknown): number | null {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "본인이 작성한 리뷰만 수정할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const rating = parseRating(body?.rating);

  if (!content) {
    return NextResponse.json({ error: "한줄평을 입력해주세요." }, { status: 400 });
  }
  if (rating === null) {
    return NextResponse.json({ error: "별점은 1~5 사이의 정수여야 합니다." }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id },
    data: { rating, content },
    include: { user: { select: { nickname: true } } },
  });

  return NextResponse.json({ review });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }
  // 관리자는 다른 사용자의 리뷰도 삭제할 수 있다 (관리자 리뷰 관리 기능).
  if (existing.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "본인이 작성한 리뷰만 삭제할 수 있습니다." }, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
