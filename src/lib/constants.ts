export const ZONES = ["정문", "상대", "예대", "후문", "공대쪽문"] as const;
export type Zone = (typeof ZONES)[number];

export const CATEGORIES = ["한식", "중식", "일식", "양식", "분식", "카페"] as const;
export type Category = (typeof CATEGORIES)[number];

// 실제 학교 좌표가 정해지기 전까지 사용하는 임시 구역별 기준점.
// Kakao Local API는 zone을 주지 않으므로, 수집된 좌표를 이 기준점과 비교해
// 가장 가까운 구역으로 분류한다 (src/lib/kakao.ts의 nearestZone 참고).
// 실제 학교가 정해지면 이 값들과 prisma/seed.ts의 좌표를 함께 교체할 것.
export const ZONE_CENTERS: Record<Zone, { latitude: number; longitude: number }> = {
  정문: { latitude: 37.5665, longitude: 126.978 },
  상대: { latitude: 37.5705, longitude: 126.979 },
  예대: { latitude: 37.5675, longitude: 126.983 },
  후문: { latitude: 37.5625, longitude: 126.977 },
  공대쪽문: { latitude: 37.5655, longitude: 126.973 },
};

// 거리순 정렬에서 위치 권한이 거부된 사용자에게 대체 기준으로 사용된다 (PRD 6.1).
export const SCHOOL_MAIN_GATE = ZONE_CENTERS.정문;

// min_price 기준 4구간 (PRD 6.1).
export const PRICE_RANGES = [
  { value: "5000", label: "~5천원" },
  { value: "10000", label: "5천~1만원" },
  { value: "20000", label: "1~2만원" },
  { value: "20000+", label: "2만원~" },
] as const;
export type PriceRangeValue = (typeof PRICE_RANGES)[number]["value"];

export const SORT_OPTIONS = [
  { value: "rating", label: "평점순" },
  { value: "distance", label: "거리순" },
  { value: "price", label: "가격순" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

