import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEW_IMAGE_MAX_COUNT, REVIEW_TAG_MAX_COUNT } from "@/lib/constants";
import { isProfane } from "@/lib/profanity";

function parseRating(value: unknown): number | null {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function parseImages(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > REVIEW_IMAGE_MAX_COUNT) return null;
  if (!value.every((url): url is string => typeof url === "string" && url.length > 0)) return null;
  return value;
}

function parseTagIds(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > REVIEW_TAG_MAX_COUNT) return null;
  if (!value.every((id): id is string => typeof id === "string" && id.length > 0)) return null;
  return [...new Set(value)];
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
  const images = parseImages(body?.images);
  const tagIds = parseTagIds(body?.tagIds);

  if (!restaurantId) {
    return NextResponse.json({ error: "식당 정보가 없습니다." }, { status: 400 });
  }
  if (rating === null) {
    return NextResponse.json({ error: "별점은 1~5 사이의 정수여야 합니다." }, { status: 400 });
  }
  if (images === null) {
    return NextResponse.json({ error: `사진은 최대 ${REVIEW_IMAGE_MAX_COUNT}장까지 첨부할 수 있습니다.` }, { status: 400 });
  }
  if (tagIds === null) {
    return NextResponse.json({ error: `키워드는 최대 ${REVIEW_TAG_MAX_COUNT}개까지 선택할 수 있습니다.` }, { status: 400 });
  }
  if (!content && tagIds.length === 0) {
    return NextResponse.json({ error: "키워드를 선택하거나 후기를 입력해주세요." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  if (tagIds.length > 0) {
    const validTagCount = await prisma.tag.count({ where: { id: { in: tagIds } } });
    if (validTagCount !== tagIds.length) {
      return NextResponse.json({ error: "존재하지 않는 키워드가 포함되어 있습니다." }, { status: 400 });
    }
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      restaurantId,
      rating,
      content,
      containsProfanity: isProfane(content),
      images: { create: images.map((url, order) => ({ url, order })) },
      reviewTags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: {
      user: { select: { nickname: true } },
      images: { orderBy: { order: "asc" } },
      reviewTags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
