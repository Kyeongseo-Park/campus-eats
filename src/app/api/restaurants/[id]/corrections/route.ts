import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const CORRECTION_CONTENT_MAX_LENGTH = 500;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "제안 내용을 입력해주세요." }, { status: 400 });
  }
  if (content.length > CORRECTION_CONTENT_MAX_LENGTH) {
    return NextResponse.json({ error: "제안 내용은 500자까지 입력할 수 있어요." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id }, select: { id: true } });
  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const pending = await prisma.restaurantCorrection.findFirst({
    where: { restaurantId: id, userId: user.id, status: "대기" },
    select: { id: true },
  });
  if (pending) {
    return NextResponse.json(
      { error: "이 식당에 검토 중인 제안이 이미 있어요. 반영되면 다시 보내주세요." },
      { status: 409 }
    );
  }

  await prisma.restaurantCorrection.create({
    data: { restaurantId: id, userId: user.id, content },
  });

  return NextResponse.json({ created: true }, { status: 201 });
}
