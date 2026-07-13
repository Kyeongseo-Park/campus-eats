import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createReviewSchema = z.object({
  restaurantId: z.string().uuid("잘못된 식당 ID입니다."),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(1, "리뷰 내용을 입력해주세요.").max(1000, "리뷰는 1000자 이하로 입력해주세요."),
});

// 마이페이지 > 내 리뷰 관리 (PRD_v2 9번).
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    include: { restaurant: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

// 로그인 필요. 한 사용자가 같은 식당에 여러 개 작성 가능 (PRD_v2 6.1).
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = createReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { restaurantId, rating, content } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: { userId: user.id, restaurantId, rating, content },
  });

  return NextResponse.json({ review }, { status: 201 });
}
