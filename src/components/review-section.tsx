"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarPicker, StaticStars } from "@/components/star-rating";
import { ReviewImageUpload } from "@/components/review-image-upload";
import { ReviewImageGallery } from "@/components/review-image-gallery";
import { ReviewHelpfulButton } from "@/components/review-helpful-button";
import { ReviewReportButton } from "@/components/review-report-button";
import { ReviewWriteModal } from "@/components/review-write-modal";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  userId: string;
  rating: number;
  content: string;
  displayContent: string;
  createdAt: string;
  updatedAt: string;
  user: { nickname: string };
  images: { id: string; url: string; order: number }[];
  tags: { id: string; label: string }[];
  helpfulCount: number;
  isHelpful: boolean;
  isReported: boolean;
};

type SortOption = "recent" | "helpful_desc" | "rating_desc" | "rating_asc";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "최신순",
  helpful_desc: "추천순",
  rating_desc: "별점 높은순",
  rating_asc: "별점 낮은순",
};

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export function ReviewSection({
  restaurantId,
  isLoggedIn,
  currentUserId,
  avgRating,
}: {
  restaurantId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  avgRating: number | null;
}) {
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // 마지막으로 성공적으로 불러온 page:sort 조합 — 현재 요청과 다르면 로딩 중인 것으로 본다.
  // (effect 안에서 직접 setLoading(true)를 호출하지 않기 위한 파생 상태)
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== `${page}:${sort}`;

  const [writeModalOpen, setWriteModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);

  const loadReviews = useCallback(
    async (targetPage: number, targetSort: SortOption) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/reviews?page=${targetPage}&sort=${targetSort}`);
      const data = await res.json();
      setReviews(data.reviews);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setLoadedKey(`${targetPage}:${targetSort}`);
    },
    [restaurantId]
  );

  useEffect(() => {
    // page/sort가 바뀔 때마다 서버에서 다시 불러온다 — setState는 fetch가 끝난 뒤 비동기로 일어난다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews(page, sort);
  }, [page, sort, loadReviews]);

  function handleSortChange(next: SortOption) {
    setSort(next);
    setPage(1);
  }

  async function handleCreated() {
    setSort("recent");
    setPage(1);
    await loadReviews(1, "recent");
  }

  function startEditing(review: ReviewItem) {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
    setEditImages(review.images.map((image) => image.url));
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, reviewId: string) {
    event.preventDefault();
    if (!editContent.trim()) return;

    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: editRating, content: editContent, images: editImages }),
    });

    if (res.ok) {
      setEditingId(null);
      await loadReviews(page, sort);
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("리뷰를 삭제할까요?")) return;

    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      const isLastItemOnPage = reviews.length === 1 && page > 1;
      const nextPage = isLastItemOnPage ? page - 1 : page;
      setPage(nextPage);
      await loadReviews(nextPage, sort);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-base font-bold text-gray-900">리뷰 {totalCount}개</h3>
          {avgRating !== null && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-gray-900">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)}
              </span>
              <div className="h-2 w-full max-w-[140px] overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(avgRating / 5) * 100}%` }} />
              </div>
              <span className="shrink-0 text-xs text-gray-400">({avgRating.toFixed(1)} / 5)</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <select
            value={sort}
            onChange={(event) => handleSortChange(event.target.value as SortOption)}
            className="h-8 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setWriteModalOpen(true)}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100 hover:text-orange-700"
            >
              + 리뷰 작성
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100"
            >
              로그인 후 작성
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-md border border-gray-200 p-8 text-center">
          <p className="text-3xl">🥣</p>
          <p className="mt-2 text-sm text-gray-500">아직 등록된 리뷰가 없어요.</p>
          <p className="text-sm text-gray-500">이 식당의 첫 번째 쩝쩝박사가 되어보세요!</p>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => setWriteModalOpen(true)}
              className="mt-4 h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              첫 리뷰 작성하기
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              첫 리뷰 작성하기
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-md border border-gray-200 p-4">
              {editingId === review.id ? (
                <form onSubmit={(event) => handleEditSubmit(event, review.id)} className="flex flex-col gap-2">
                  <StarPicker value={editRating} onChange={setEditRating} />
                  <Input value={editContent} onChange={(event) => setEditContent(event.target.value)} />
                  <ReviewImageUpload images={editImages} onChange={setEditImages} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      저장
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      취소
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" className="size-7">
                        <AvatarFallback className="text-xs">{review.user.nickname.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold text-gray-900">{review.user.nickname}</span>
                      <StaticStars rating={review.rating} />
                    </div>
                    <span className="text-xs font-normal text-gray-500">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {review.tags.map((tag) => (
                        <span key={tag.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[12px] text-gray-600">
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                    {review.displayContent}
                    {review.updatedAt !== review.createdAt && (
                      <span className="ml-1 text-xs text-muted-foreground">(수정됨)</span>
                    )}
                  </p>
                  <ReviewImageGallery images={review.images} />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ReviewHelpfulButton
                        reviewId={review.id}
                        initialCount={review.helpfulCount}
                        initialVoted={review.isHelpful}
                        isLoggedIn={isLoggedIn}
                      />
                      <ReviewReportButton
                        reviewId={review.id}
                        isLoggedIn={isLoggedIn}
                        initialReported={review.isReported}
                      />
                    </div>
                    {currentUserId === review.userId && (
                      <div className="flex gap-1">
                        <Button size="xs" variant="ghost" onClick={() => startEditing(review)}>
                          수정
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => handleDelete(review.id)}>
                          삭제
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && <ReviewPagination page={page} totalPages={totalPages} onChange={setPage} />}

      <ReviewWriteModal
        restaurantId={restaurantId}
        open={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function ReviewPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const WINDOW = 5;
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
  const pages = Array.from({ length: Math.min(WINDOW, totalPages) }, (_, i) => Math.max(1, start) + i);

  return (
    <div className="flex items-center justify-center gap-1 pt-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="이전 페이지"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "flex size-7 items-center justify-center rounded-lg text-xs font-medium",
            p === page ? "bg-primary text-primary-foreground" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          {p}
        </button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="다음 페이지"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
