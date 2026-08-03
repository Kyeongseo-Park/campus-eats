import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const review = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!review) {
    return NextResponse.json({ error: "존재하지 않는 리뷰입니다." }, { status: 404 });
  }

  await prisma.reviewHelpful.upsert({
    where: { userId_reviewId: { userId: user.id, reviewId: id } },
    create: { userId: user.id, reviewId: id },
    update: {},
  });

  return NextResponse.json({ helpful: true }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await prisma.reviewHelpful.deleteMany({
    where: { userId: user.id, reviewId: id },
  });

  return NextResponse.json({ helpful: false });
}
