import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { PRICE_RANGES, SCHOOL_MAIN_GATE, type SortOption } from "@/lib/constants";

// PRD_v2 6.1/12번 참고: 선택하지 않은 필터는 전체로 간주한다.
// 평점순 정렬을 위해 리뷰 평점을 함께 조회해 애플리케이션에서 평균을 계산한다.
function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get("zone");
  const category = searchParams.get("category");
  const priceRangeLabel = searchParams.get("priceRange");
  const sort = (searchParams.get("sort") as SortOption | null) ?? "평점순";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const priceRange = PRICE_RANGES.find((range) => range.label === priceRangeLabel);

  const restaurants = await prisma.restaurant.findMany({
    where: {
      ...(zone ? { zone } : {}),
      ...(category ? { category } : {}),
      ...(priceRange
        ? {
            minPrice: {
              gte: priceRange.min,
              ...(priceRange.max ? { lte: priceRange.max } : {}),
            },
          }
        : {}),
    },
    include: {
      reviews: { select: { rating: true } },
    },
  });

  const userLocation =
    lat && lng
      ? { latitude: Number(lat), longitude: Number(lng) }
      : SCHOOL_MAIN_GATE;

  const withComputedFields = restaurants.map((restaurant) => {
    const { reviews, ...rest } = restaurant;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    const distanceKm = haversineDistanceKm(userLocation, restaurant);

    return { ...rest, avgRating, distanceKm };
  });

  withComputedFields.sort((a, b) => {
    if (sort === "거리순") return a.distanceKm - b.distanceKm;
    if (sort === "가격순") return (a.minPrice ?? 0) - (b.minPrice ?? 0);
    return b.avgRating - a.avgRating; // 평점순 (기본값)
  });

  return NextResponse.json({ restaurants: withComputedFields });
}
