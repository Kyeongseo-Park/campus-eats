"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarPicker, StaticStars } from "@/components/star-rating";
import { ReviewImageUpload } from "@/components/review-image-upload";
import { ReviewImageGallery } from "@/components/review-image-gallery";
import { ReviewHelpfulButton } from "@/components/review-helpful-button";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { nickname: string };
  images: { id: string; url: string; order: number }[];
  helpfulCount: number;
  isHelpful: boolean;
};

type SortOption = "recent" | "rating_desc" | "rating_asc";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "최신순",
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
}: {
  restaurantId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
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

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("한줄평을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, rating, content, images }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "리뷰 작성에 실패했습니다.");
        return;
      }

      setContent("");
      setRating(5);
      setImages([]);
      setShowForm(false);
      setSort("recent");
      setPage(1);
      await loadReviews(1, "recent");
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900">리뷰 ({totalCount})</h3>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(event) => handleSortChange(event.target.value as SortOption)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
              onClick={() => setShowForm((prev) => !prev)}
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

      {showForm && (
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-2 rounded-md border p-3">
          <span className="text-sm font-medium">리뷰 작성</span>
          <StarPicker value={rating} onChange={setRating} />
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="한줄평을 남겨주세요"
          />
          <ReviewImageUpload images={images} onChange={setImages} disabled={isSubmitting} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? "등록 중..." : "리뷰 등록"}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="py-4 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : reviews.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">아직 리뷰가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-2xs">
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
                      <span className="text-sm font-bold text-gray-900">{review.user.nickname}</span>
                      <StaticStars rating={review.rating} />
                    </div>
                    <span className="text-[11px] font-normal text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-normal text-gray-700">
                    {review.content}
                    {review.updatedAt !== review.createdAt && (
                      <span className="ml-1 text-xs text-muted-foreground">(수정됨)</span>
                    )}
                  </p>
                  <ReviewImageGallery images={review.images} />
                  <div className="mt-1 flex items-center justify-between">
                    <ReviewHelpfulButton
                      reviewId={review.id}
                      initialCount={review.helpfulCount}
                      initialVoted={review.isHelpful}
                      isLoggedIn={isLoggedIn}
                      className="-ml-2 w-fit"
                    />
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
