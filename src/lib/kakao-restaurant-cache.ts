import type { RestaurantListItem } from "@/lib/types";

const PREFIX = "kakao-restaurant:";

// DB가 없는 카카오 검색 결과("kakao-"로 시작하는 id)는 상세 페이지에서 다시 조회할 방법이 없으므로,
// 목록/지도에서 클릭하는 시점에 이미 가진 데이터를 세션에 잠깐 캐싱해 상세 페이지가 그대로 재사용한다.
// id에 콜론(:)을 쓰면 라우팅 과정에서 퍼센트 인코딩된 채로 클라이언트에 전달돼 접두사 체크가 깨지는
// 문제가 있어(예: kakao%3A123), URL path segment에서 항상 안전한 하이픈을 구분자로 쓴다.
export function cacheKakaoRestaurant(item: RestaurantListItem) {
  if (typeof window === "undefined" || !item.id.startsWith("kakao-")) return;
  try {
    sessionStorage.setItem(PREFIX + item.id, JSON.stringify(item));
  } catch {
    // sessionStorage 사용 불가 환경(프라이빗 모드 등)에서는 조용히 무시한다.
  }
}

export function readCachedKakaoRestaurant(id: string): RestaurantListItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    return raw ? (JSON.parse(raw) as RestaurantListItem) : null;
  } catch {
    return null;
  }
}
