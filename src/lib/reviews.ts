export type RatedItem = { rating: number };

// 평점순 정렬(src/lib/restaurants.ts)과 식당 상세 페이지가 동일한 계산식을 쓰도록 공유한다.
export function calculateAverageRating(reviews: RatedItem[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
