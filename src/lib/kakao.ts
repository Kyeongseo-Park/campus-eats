import { CATEGORIES, ZONES, ZONE_CENTERS, type Category, type Zone } from "@/lib/constants";

// Kakao Local API 키워드 검색(GET /v2/local/search/keyword.json) 응답의 document 하나.
// 실제 응답에는 이 외에도 phone, place_url 등이 더 있지만, 우리가 쓰는 필드만 선언한다.
export type KakaoPlaceDocument = {
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도(longitude), 문자열로 내려온다
  y: string; // 위도(latitude), 문자열로 내려온다
};

export type MenuInput = { name: string; price: number };

export type RestaurantSeedInput = {
  name: string;
  category: Category;
  zone: Zone;
  address: string;
  latitude: number;
  longitude: number;
  menus: MenuInput[];
};

const DRINKING_KEYWORDS = ["술집", "호프", "포차"];

// PRD 6.2: category_name에 술집 관련 키워드가 포함된 장소는 수집 대상에서 제외한다.
export function isDrinkingEstablishment(categoryName: string): boolean {
  return DRINKING_KEYWORDS.some((keyword) => categoryName.includes(keyword));
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  한식: ["한식"],
  중식: ["중식"],
  일식: ["일식", "돈까스", "라멘", "돈부리", "스시", "초밥"],
  양식: ["양식"],
  분식: ["분식"],
  카페: ["카페", "베이커리", "디저트"],
};

// Kakao의 category_name(예: "음식점 > 한식 > 국밥")을 우리 6개 카테고리 중 하나로 매핑한다.
// 매칭되는 키워드가 없으면 null — 관리자가 수동으로 분류해야 하는 케이스로 취급한다.
export function mapCategoryName(categoryName: string): Category | null {
  return (
    CATEGORIES.find((category) =>
      CATEGORY_KEYWORDS[category].some((keyword) => categoryName.includes(keyword))
    ) ?? null
  );
}

// Kakao는 zone 정보를 주지 않으므로, 구역별 기준 좌표와의 거리가 가장 가까운 구역으로 분류한다.
export function nearestZone(latitude: number, longitude: number): Zone {
  return ZONES.reduce((closest, zone) => {
    const distanceToZone =
      (latitude - ZONE_CENTERS[zone].latitude) ** 2 + (longitude - ZONE_CENTERS[zone].longitude) ** 2;
    const distanceToClosest =
      (latitude - ZONE_CENTERS[closest].latitude) ** 2 +
      (longitude - ZONE_CENTERS[closest].longitude) ** 2;
    return distanceToZone < distanceToClosest ? zone : closest;
  }, ZONES[0]);
}

// Kakao 응답 document + 수동으로 조사한 메뉴/가격을 우리 Restaurant 시딩 입력 형태로 변환한다.
// 주점 카테고리이거나 6개 카테고리 중 어디에도 매칭되지 않으면 null을 반환해 수집 대상에서 제외한다.
export function mapKakaoDocumentToRestaurantInput(
  document: KakaoPlaceDocument,
  menus: MenuInput[]
): RestaurantSeedInput | null {
  if (isDrinkingEstablishment(document.category_name)) return null;

  const category = mapCategoryName(document.category_name);
  if (!category) return null;

  const latitude = Number(document.y);
  const longitude = Number(document.x);

  return {
    name: document.place_name,
    category,
    zone: nearestZone(latitude, longitude),
    address: document.road_address_name || document.address_name,
    latitude,
    longitude,
    menus,
  };
}
