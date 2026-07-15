export function formatMinPrice(minPrice: number | null): string {
  return minPrice !== null ? `${minPrice.toLocaleString()}원~` : "가격 정보 없음";
}
