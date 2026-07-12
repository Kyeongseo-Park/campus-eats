import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(1, "리뷰 내용을 입력해주세요.").max(1000, "리뷰는 1000자 이하로 입력해주세요."),
});

// 리뷰 수정 화면 진입 시 기존 내용을 불러오기 위한 조회 (작성자 본인만).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: { restaurant: { select: { id: true, name: true } } },
  });

  if (!review || review.userId !== user.id) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }

  return NextResponse.json({ review });
}

// 작성자 본인만 수정/삭제 가능 (PRD_v2 6.1).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "본인이 작성한 리뷰만 수정할 수 있습니다." }, { status: 403 });
  }

  const parsed = updateReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const review = await prisma.review.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ review });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "본인이 작성한 리뷰만 삭제할 수 있습니다." }, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
