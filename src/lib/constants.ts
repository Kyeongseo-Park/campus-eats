// PRD_v2 6.1 기준 고정값. DB 컬럼은 VARCHAR이므로 여기서 애플리케이션 레벨로 검증한다.

export const ZONES = ["정문", "상대", "예대", "후문", "공대쪽문"] as const;
export type Zone = (typeof ZONES)[number];

export const CATEGORIES = ["한식", "중식", "일식", "양식", "분식", "카페"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRICE_RANGES = [
  { label: "~5천원", min: 0, max: 5000 },
  { label: "~1만원", min: 5001, max: 10000 },
  { label: "~2만원", min: 10001, max: 20000 },
  { label: "2만원~", min: 20001, max: null },
] as const;
export type PriceRangeLabel = (typeof PRICE_RANGES)[number]["label"];

export const SORT_OPTIONS = ["평점순", "거리순", "가격순"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const REQUEST_STATUSES = ["대기", "승인", "반려"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// 위치 권한 거부 시 대체 기준 좌표 (학교 정문). 실제 좌표로 교체 필요.
export const SCHOOL_MAIN_GATE = { latitude: 35.1759, longitude: 126.9068 };
