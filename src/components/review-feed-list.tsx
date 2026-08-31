"use client";

import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StaticStars } from "@/components/star-rating";
import { ReviewImageGallery } from "@/components/review-image-gallery";
import { RestaurantDetailModal } from "@/components/restaurant-detail-modal";

export type FeedReview = {
  id: string;
  rating: number;
  displayContent: string;
  isEdited: boolean;
  createdAt: string;
  nickname: string;
  restaurant: { id: string; name: string };
  images: { id: string; url: string; order: number }[];
  helpfulCount: number;
};

// 리뷰 피드 목록. 식당 이름을 누르면 지도/목록 화면과 동일한 RestaurantDetailModal을 연다
// (구 /restaurants/[id] 페이지로 이동하지 않는다).
export function ReviewFeedList({
  reviews,
  isLoggedIn,
  currentUserId,
}: {
  reviews: FeedReview[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-md border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar size="sm" className="size-7">
                  <AvatarFallback className="text-xs">{review.nickname.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-bold text-gray-900">{review.nickname}</span>
                <StaticStars rating={review.rating} />
              </div>
              <span className="text-xs font-normal text-gray-500">{review.createdAt}</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRestaurantId(review.restaurant.id)}
              className="mt-1.5 inline-block text-xs font-semibold text-orange-600 hover:underline"
            >
              {review.restaurant.name}
            </button>

            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              {review.displayContent}
              {review.isEdited && <span className="ml-1 text-xs text-muted-foreground">(수정됨)</span>}
            </p>

            <ReviewImageGallery images={review.images} />

            {review.helpfulCount > 0 && (
              <p className="mt-2 text-xs text-gray-400">도움돼요 {review.helpfulCount}</p>
            )}
          </li>
        ))}
      </ul>

      <RestaurantDetailModal
        restaurantId={selectedRestaurantId}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        onClose={() => setSelectedRestaurantId(null)}
      />
    </>
  );
}
