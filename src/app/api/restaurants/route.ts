import { NextRequest, NextResponse } from "next/server";

import { haversineDistanceKm } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { PRICE_RANGES, SCHOOL_MAIN_GATE, type SortOption } from "@/lib/constants";

// PRD_v2 6.1/12번 참고: 선택하지 않은 필터는 전체로 간주한다.
// 평점순 정렬을 위해 리뷰 평점을 함께 조회해 애플리케이션에서 평균을 계산한다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zone = searchParams.get("zone");
  const category = searchParams.get("category");
  const priceRangeLabel = searchParams.get("priceRange");
  const sort = (searchParams.get("sort") as SortOption | null) ?? "평점순";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const search = searchParams.get("search")?.trim();

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
      // PRD_v2 6.1번: 식당명 또는 메뉴명(Menu 테이블 전체) 검색
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { menus: { some: { name: { contains: search, mode: "insensitive" } } } },
            ],
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
