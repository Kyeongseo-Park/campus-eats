import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";
import { haversineDistanceKm, type Coordinates } from "@/lib/geo";
import { calculateAverageRating } from "@/lib/reviews";
import { SCHOOL_MAIN_GATE, type PriceRangeValue, type SortValue } from "@/lib/constants";

export type RestaurantSearchParams = {
  q?: string;
  zones?: string[];
  categories?: string[];
  priceRanges?: PriceRangeValue[];
  partnershipOnly?: boolean;
  sort?: SortValue;
  origin?: Coordinates;
};

export type RestaurantListItem = {
  id: string;
  name: string;
  category: string;
  zone: string;
  /// 메뉴 정보가 없는 식당은 null ("가격 정보 없음"). formatMinPrice로 표시한다.
  minPrice: number | null;
  latitude: number;
  longitude: number;
  isPartnershipActive: boolean;
  avgRating: number | null;
  reviewCount: number;
  distanceKm: number;
  /// 요약카드에 보여줄 대표메뉴 최대 3개.
  menus: { name: string; price: number }[];
};

// 가격대는 배타적 구간이다. 여러 개를 체크하면 각 구간을 OR로 묶어서 보여준다
// (예: "~5천원" + "2만원~"을 함께 체크하면 아주 저렴하거나 아주 비싼 곳만 나온다).
function priceRangeCondition(priceRange: PriceRangeValue): Prisma.RestaurantWhereInput {
  switch (priceRange) {
    case "5000":
      return { minPrice: { lte: 5000 } };
    case "10000":
      return { minPrice: { gt: 5000, lte: 10000 } };
    case "20000":
      return { minPrice: { gt: 10000, lte: 20000 } };
    case "20000+":
      return { minPrice: { gt: 20000 } };
  }
}

// PRD 12번 필터 로직을 따르되, 각 필터를 다중 선택할 수 있도록 확장한다:
// 같은 필터 안에서 여러 개를 선택하면 OR(둘 중 하나), 다른 필터끼리는 AND로 묶인다.
export async function searchRestaurants(params: RestaurantSearchParams): Promise<RestaurantListItem[]> {
  const and: Prisma.RestaurantWhereInput[] = [];

  if (params.zones?.length) and.push({ zone: { in: params.zones } });
  if (params.categories?.length) and.push({ category: { in: params.categories } });
  if (params.priceRanges?.length) and.push({ OR: params.priceRanges.map(priceRangeCondition) });

  if (params.partnershipOnly) {
    const now = new Date();
    and.push({ partnershipStartDate: { lte: now }, partnershipEndDate: { gte: now } });
  }

  if (params.q) {
    and.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { menus: { some: { name: { contains: params.q, mode: "insensitive" } } } },
      ],
    });
  }

  const where: Prisma.RestaurantWhereInput = and.length > 0 ? { AND: and } : {};

  const restaurants = await prisma.restaurant.findMany({
    where,
    include: {
      reviews: { select: { rating: true } },
      menus: { select: { name: true, price: true }, take: 3 },
    },
  });

  const origin = params.origin ?? SCHOOL_MAIN_GATE;

  const items: RestaurantListItem[] = restaurants.map((r) => {
    const avgRating = calculateAverageRating(r.reviews);

    return {
      id: r.id,
      name: r.name,
      category: r.category,
      zone: r.zone,
      minPrice: r.minPrice,
      latitude: r.latitude,
      longitude: r.longitude,
      isPartnershipActive: isPartnershipActive(r.partnershipStartDate, r.partnershipEndDate),
      avgRating,
      reviewCount: r.reviews.length,
      distanceKm: haversineDistanceKm(origin, { latitude: r.latitude, longitude: r.longitude }),
      menus: r.menus,
    };
  });

  return sortRestaurants(items, params.sort ?? "rating");
}

function sortRestaurants(items: RestaurantListItem[], sort: SortValue): RestaurantListItem[] {
  const sorted = [...items];

  if (sort === "price") {
    // 가격 정보가 없는 식당(minPrice: null)은 정렬 방향과 무관하게 항상 맨 뒤로 보낸다.
    sorted.sort((a, b) => {
      if (a.minPrice === null) return b.minPrice === null ? 0 : 1;
      if (b.minPrice === null) return -1;
      return a.minPrice - b.minPrice;
    });
  } else if (sort === "distance") {
    sorted.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    sorted.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0) || a.name.localeCompare(b.name, "ko"));
  }

  return sorted;
}
