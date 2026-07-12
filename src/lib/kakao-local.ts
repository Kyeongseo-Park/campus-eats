import { SCHOOL_MAIN_GATE } from "@/lib/constants";

const KAKAO_KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

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

interface KakaoKeywordSearchDocument {
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

interface KakaoKeywordSearchResponse {
  documents: KakaoKeywordSearchDocument[];
}

// 학교 주변 결과를 우선 보여주기 위해 정문 좌표를 중심으로 검색한다(정렬 방식 자체는 그대로 정확도순).
export async function searchKakaoPlaces(query: string): Promise<KakaoPlaceResult[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error("KAKAO_REST_API_KEY가 설정되지 않았습니다.");
  }

  const url = new URL(KAKAO_KEYWORD_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("x", String(SCHOOL_MAIN_GATE.longitude));
  url.searchParams.set("y", String(SCHOOL_MAIN_GATE.latitude));
  url.searchParams.set("radius", "20000");
  url.searchParams.set("size", "15");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Kakao Local API 요청이 실패했습니다. (status: ${res.status})`);
  }

  const data = (await res.json()) as KakaoKeywordSearchResponse;

  return data.documents.map((doc) => ({
    kakaoPlaceId: doc.id,
    name: doc.place_name,
    category: doc.category_name,
    phone: doc.phone,
    address: doc.address_name,
    roadAddress: doc.road_address_name,
    latitude: Number(doc.y),
    longitude: Number(doc.x),
    placeUrl: doc.place_url,
  }));
}
