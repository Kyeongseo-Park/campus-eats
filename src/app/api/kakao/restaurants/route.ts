import { NextRequest, NextResponse } from "next/server";

import { SCHOOL_MAIN_GATE, type SortOption } from "@/lib/constants";
import { haversineDistanceKm } from "@/lib/geo";
import { guessCategory } from "@/lib/kakao-category";
import { searchKakaoPlaces, searchNearbyKakaoPlaces, type KakaoPlaceResult } from "@/lib/kakao-local";
import type { RestaurantListItem } from "@/lib/types";

// DB가 아직 연결되지 않은 상태에서 지도/목록을 채우기 위한 임시 데이터 소스.
// Neon DB 연결 후에는 /api/restaurants(관리자가 zone/최저가 등을 보완해 등록한 데이터)로 전환한다.
// zone(구역) 정보는 카카오에 없어 빈 문자열로 둔다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = (searchParams.get("sort") as SortOption | null) ?? "평점순";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const search = searchParams.get("search")?.trim();

  const userLocation =
    lat && lng ? { latitude: Number(lat), longitude: Number(lng) } : SCHOOL_MAIN_GATE;

  try {
    const places: KakaoPlaceResult[] = search
      ? await searchKakaoPlaces(search)
      : await searchNearbyKakaoPlaces(userLocation);

    let items: RestaurantListItem[] = places.map((place) => ({
      id: `kakao-${place.kakaoPlaceId}`,
      name: place.name,
      category: guessCategory(place.category) ?? place.category.split(" > ").at(-1) ?? "기타",
      zone: "",
      address: place.roadAddress || place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      minPrice: null,
      avgRating: 0,
      distanceKm: haversineDistanceKm(userLocation, place),
      phone: place.phone || null,
      placeUrl: place.placeUrl,
    }));

    if (category) items = items.filter((item) => item.category === category);

    // 카카오 데이터에는 평점/가격이 없어 평점순은 거리순과 동일하게 동작한다.
    items.sort((a, b) => {
      if (sort === "가격순") return 0;
      return a.distanceKm - b.distanceKm;
    });

    return NextResponse.json({ restaurants: items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "카카오 식당 정보를 가져오지 못했습니다." }, { status: 502 });
  }
}
