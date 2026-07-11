import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseRating(value: unknown): number | null {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const rating = parseRating(body?.rating);

  if (!restaurantId || !content) {
    return NextResponse.json({ error: "별점과 한줄평을 입력해주세요." }, { status: 400 });
  }
  if (rating === null) {
    return NextResponse.json({ error: "별점은 1~5 사이의 정수여야 합니다." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: { userId: user.id, restaurantId, rating, content },
    include: { user: { select: { nickname: true } } },
  });

  return NextResponse.json({ review }, { status: 201 });
}
