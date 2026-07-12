import { SCHOOL_MAIN_GATE } from "@/lib/constants";
import type { LatLng } from "@/lib/geo";

const KAKAO_KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_CATEGORY_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/category.json";

// 음식점(FD6) + 카페(CE7). https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-category-group-code
const FOOD_CATEGORY_GROUP_CODES = ["FD6", "CE7"] as const;

export interface KakaoPlaceResult {
  kakaoPlaceId: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  placeUrl: string;
}

interface KakaoSearchDocument {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
}

interface KakaoSearchResponse {
  documents: KakaoSearchDocument[];
  meta: { is_end: boolean };
}

function requireApiKey(): string {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error("KAKAO_REST_API_KEY가 설정되지 않았습니다.");
  }
  return apiKey;
}

function mapDocument(doc: KakaoSearchDocument): KakaoPlaceResult {
  return {
    kakaoPlaceId: doc.id,
    name: doc.place_name,
    category: doc.category_name,
    phone: doc.phone,
    address: doc.address_name,
    roadAddress: doc.road_address_name,
    latitude: Number(doc.y),
    longitude: Number(doc.x),
    placeUrl: doc.place_url,
  };
}

async function fetchKakaoLocal(url: URL): Promise<KakaoSearchResponse> {
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${requireApiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Kakao Local API 요청이 실패했습니다. (status: ${res.status})`);
  }
  return (await res.json()) as KakaoSearchResponse;
}

// 학교 주변 결과를 우선 보여주기 위해 정문 좌표를 중심으로 검색한다(정렬 방식 자체는 그대로 정확도순).
export async function searchKakaoPlaces(query: string): Promise<KakaoPlaceResult[]> {
  const url = new URL(KAKAO_KEYWORD_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("x", String(SCHOOL_MAIN_GATE.longitude));
  url.searchParams.set("y", String(SCHOOL_MAIN_GATE.latitude));
  url.searchParams.set("radius", "20000");
  url.searchParams.set("size", "15");

  const data = await fetchKakaoLocal(url);
  return data.documents.map(mapDocument);
}

// DB 없이도 지도/목록을 채우기 위해, 캠퍼스 주변 음식점·카페를 카테고리 검색으로 가져온다.
// 카테고리별 최대 2페이지(최대 30건)까지만 조회해 응답 시간을 제한한다.
export async function searchNearbyKakaoPlaces(
  center: LatLng = SCHOOL_MAIN_GATE,
  radiusMeters = 1500,
): Promise<KakaoPlaceResult[]> {
  const results: KakaoPlaceResult[] = [];

  for (const categoryGroupCode of FOOD_CATEGORY_GROUP_CODES) {
    for (let page = 1; page <= 2; page++) {
      const url = new URL(KAKAO_CATEGORY_SEARCH_URL);
      url.searchParams.set("category_group_code", categoryGroupCode);
      url.searchParams.set("x", String(center.longitude));
      url.searchParams.set("y", String(center.latitude));
      url.searchParams.set("radius", String(radiusMeters));
      url.searchParams.set("sort", "distance");
      url.searchParams.set("size", "15");
      url.searchParams.set("page", String(page));

      const data = await fetchKakaoLocal(url);
      results.push(...data.documents.map(mapDocument));
      if (data.meta.is_end) break;
    }
  }

  const seen = new Set<string>();
  return results.filter((place) => {
    if (seen.has(place.kakaoPlaceId)) return false;
    seen.add(place.kakaoPlaceId);
    return true;
  });
}
