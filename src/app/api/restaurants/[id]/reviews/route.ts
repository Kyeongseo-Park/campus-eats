import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDisplayContent } from "@/lib/profanity";

export const REVIEW_PAGE_SIZE = 10;

type SortOption = "recent" | "helpful_desc" | "rating_desc" | "rating_asc";

function parseSort(value: string | null): SortOption {
  if (value === "helpful_desc" || value === "rating_desc" || value === "rating_asc") return value;
  return "recent";
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

const ORDER_BY: Record<SortOption, Prisma.ReviewOrderByWithRelationInput[]> = {
  recent: [{ createdAt: "desc" }],
  helpful_desc: [{ helpfulVotes: { _count: "desc" } }, { createdAt: "desc" }],
  rating_desc: [{ rating: "desc" }, { createdAt: "desc" }],
  rating_asc: [{ rating: "asc" }, { createdAt: "desc" }],
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sort = parseSort(searchParams.get("sort"));
  const page = parsePage(searchParams.get("page"));

  const currentUser = await getCurrentUser();

  const [totalCount, reviewRows] = await Promise.all([
    prisma.review.count({ where: { restaurantId: id } }),
    prisma.review.findMany({
      where: { restaurantId: id },
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * REVIEW_PAGE_SIZE,
      take: REVIEW_PAGE_SIZE,
      include: {
        user: { select: { nickname: true } },
        images: { orderBy: { order: "asc" } },
        reviewTags: { include: { tag: true }, orderBy: { tag: { order: "asc" } } },
        _count: { select: { helpfulVotes: true } },
      },
    }),
  ]);

  const [helpfulReviewIds, reportedReviewIds] = await Promise.all([
    currentUser
      ? prisma.reviewHelpful.findMany({
          where: { userId: currentUser.id, reviewId: { in: reviewRows.map((review) => review.id) } },
          select: { reviewId: true },
        })
      : Promise.resolve([]),
    currentUser
      ? prisma.report.findMany({
          where: { userId: currentUser.id, reviewId: { in: reviewRows.map((review) => review.id) } },
          select: { reviewId: true },
        })
      : Promise.resolve([]),
  ]);
  const helpfulReviewIdSet = new Set(helpfulReviewIds.map((row) => row.reviewId));
  const reportedReviewIdSet = new Set(reportedReviewIds.map((row) => row.reviewId));

  const reviews = reviewRows.map((review) => ({
    id: review.id,
    userId: review.userId,
    rating: review.rating,
    // 원문은 그대로(본인 리뷰 수정 시 사용), displayContent는 마스킹된 표시용.
    content: review.content,
    displayContent: getDisplayContent(review.content, review.containsProfanity),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    images: review.images,
    tags: review.reviewTags.map((rt) => ({ id: rt.tag.id, label: rt.tag.label })),
    helpfulCount: review._count.helpfulVotes,
    isHelpful: helpfulReviewIdSet.has(review.id),
    isReported: reportedReviewIdSet.has(review.id),
  }));

  return NextResponse.json({
    reviews,
    page,
    pageSize: REVIEW_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / REVIEW_PAGE_SIZE)),
  });
}
