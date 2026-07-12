import { PRICE_RANGES } from "@/lib/constants";

export function priceRangeLabel(minPrice: number | null) {
  if (minPrice == null) return "가격 정보 없음";
  const range = PRICE_RANGES.find(
    (r) => minPrice >= r.min && (r.max === null || minPrice <= r.max),
  );
  return range?.label ?? "가격 정보 없음";
}

export function formatDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function distanceLabel(distanceKm: number) {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`;
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  대기: "⏳ 대기",
  승인: "✅ 승인",
  반려: "❌ 반려",
};

export function requestStatusLabel(status: string) {
  return REQUEST_STATUS_LABELS[status] ?? status;
}
