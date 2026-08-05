export const ZONES = ["정문", "상대", "예대", "후문", "공대쪽문"] as const;
export type Zone = (typeof ZONES)[number];

export const CATEGORIES = ["한식", "중식", "일식", "양식", "분식", "카페", "패스트푸드", "기타"] as const;
export type Category = (typeof CATEGORIES)[number];

// 전남대(용봉동) 근처, 구역별로 실제 존재하는 랜드마크 상호의 좌표를 기준점으로 쓴다
// (Kakao Local API 키워드 검색으로 조회). Kakao Local API는 zone을 주지 않으므로,
// 수집된 좌표를 이 기준점과 비교해 가장 가까운 구역으로 분류한다
// (src/lib/kakao.ts의 nearestZone 참고).
export const ZONE_CENTERS: Record<Zone, { latitude: number; longitude: number }> = {
  정문: { latitude: 35.17163868927537, longitude: 126.90477089688265 }, // 글로어 전대정문점
  상대: { latitude: 35.1779361337302, longitude: 126.900978292277 }, // 카페 리피피
  예대: { latitude: 35.1805882432495, longitude: 126.903608815887 }, // 지코바 용봉1호점
  후문: { latitude: 35.17546709540153, longitude: 126.91364527996932 }, // 피자치킨콜 전대점
  공대쪽문: { latitude: 35.178576115306534, longitude: 126.91272311487184 }, // 도스마스 전남대2호점
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

// 식당 제보 상태별 뱃지 스타일 (마이페이지 요약/제보 관리 페이지에서 공용으로 사용).
export const REQUEST_STATUS_BADGE_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  대기: "outline",
  승인: "secondary",
  반려: "destructive",
};

// 리뷰 사진 첨부 제한 (docs/03_Design/# 리뷰 사진 추가 Design.md 스펙).
export const REVIEW_IMAGE_MAX_COUNT = 3;
export const REVIEW_IMAGE_MAX_SIZE_MB = 5;
// HEIC 등 브라우저가 표시 못 하는 포맷은 제외 (src/lib/image-resize.ts가 jpeg로 변환 시도하되,
// 변환 실패 시 원본이 그대로 남을 수 있어 업로드 단계에서 한 번 더 검증한다).
export const REVIEW_IMAGE_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

// 리뷰 작성 모달의 키워드 태그 선택 개수 제한 (docs/03_Design 리뷰 화면 개선 스펙).
export const REVIEW_TAG_MAX_COUNT = 5;

