import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isPartnershipActive } from "@/lib/partnership";
import { getOpenStatus, type BusinessHours } from "@/lib/business-hours";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [restaurant, reviewAgg, currentUser] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id }, include: { menus: true } }),
    prisma.review.aggregate({ where: { restaurantId: id }, _avg: { rating: true }, _count: { _all: true } }),
    getCurrentUser(),
  ]);

  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const favorite = currentUser
    ? await prisma.favorite.findUnique({
        where: { userId_restaurantId: { userId: currentUser.id, restaurantId: id } },
      })
    : null;

  const businessHours = restaurant.businessHours as BusinessHours | null;
  const partnershipActive = isPartnershipActive(restaurant.partnershipStartDate, restaurant.partnershipEndDate);

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      category: restaurant.category,
      zone: restaurant.zone,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      businessHours,
      openStatus: getOpenStatus(businessHours),
      avgRating: reviewAgg._avg.rating,
      reviewCount: reviewAgg._count._all,
      menus: restaurant.menus.map((menu) => ({ id: menu.id, name: menu.name, price: menu.price })),
      isFavorited: favorite !== null,
      isPartnershipActive: partnershipActive,
    },
    isLoggedIn: !!currentUser,
    currentUserId: currentUser?.id ?? null,
  });
}
