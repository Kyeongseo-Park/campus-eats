import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

import { AdminPager } from "@/components/admin-pager";
import { EmptyState } from "@/components/empty-state";
import { ReviewFeedList, type FeedReview } from "@/components/review-feed-list";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDisplayContent } from "@/lib/profanity";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type SortValue = "recent" | "helpful";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "helpful", label: "추천순" },
];

const ORDER_BY: Record<SortValue, Prisma.ReviewOrderByWithRelationInput[]> = {
  recent: [{ createdAt: "desc" }],
  helpful: [{ helpfulVotes: { _count: "desc" } }, { createdAt: "desc" }],
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseSort(value: string | undefined): SortValue {
  return value === "helpful" ? "helpful" : "recent";
}

export default async function ReviewsFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const sort = parseSort(firstParam(sp.sort));
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const [rows, total, currentUser] = await Promise.all([
    prisma.review.findMany({
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { nickname: true } },
        restaurant: { select: { id: true, name: true } },
        images: { orderBy: { order: "asc" } },
        _count: { select: { helpfulVotes: true } },
      },
    }),
    prisma.review.count(),
    getCurrentUser(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const reviews: FeedReview[] = rows.map((review) => ({
    id: review.id,
    rating: review.rating,
    displayContent: getDisplayContent(review.content, review.containsProfanity),
    isEdited: review.updatedAt.getTime() !== review.createdAt.getTime(),
    createdAt: review.createdAt.toISOString().slice(0, 10),
    nickname: review.user.nickname,
    restaurant: review.restaurant,
    images: review.images.map((image) => ({ id: image.id, url: image.url, order: image.order })),
    helpfulCount: review._count.helpfulVotes,
  }));

  function buildHref(params: { sort?: SortValue; page?: number }) {
    const next = new URLSearchParams();
    const nextSort = params.sort ?? sort;
    if (nextSort !== "recent") next.set("sort", nextSort);
    const nextPage = params.page ?? page;
    if (nextPage > 1) next.set("page", String(nextPage));
    const query = next.toString();
    return query ? `/reviews?${query}` : "/reviews";
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">리뷰</h1>
        <p className="text-sm text-muted-foreground">우리 학교 주변 식당들의 최신 리뷰</p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => {
            const selected = option.value === sort;
            return (
              <Link
                key={option.value}
                href={buildHref({ sort: option.value, page: 1 })}
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="아직 등록된 리뷰가 없어요"
            description="식당 상세 화면에서 첫 리뷰를 남겨보세요."
            action={
              <Link
                href="/"
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                식당 둘러보기
              </Link>
            }
          />
        ) : (
          <ReviewFeedList
            reviews={reviews}
            isLoggedIn={!!currentUser}
            currentUserId={currentUser?.id ?? null}
          />
        )}

        {totalPages > 1 && (
          <AdminPager
            page={page}
            totalPages={totalPages}
            total={total}
            buildHref={(targetPage) => buildHref({ page: targetPage })}
          />
        )}
      </section>
    </main>
  );
}
