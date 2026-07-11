import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menus: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const partnershipActive = isPartnershipActive(
    restaurant.partnershipStartDate,
    restaurant.partnershipEndDate
  );

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      category: restaurant.category,
      zone: restaurant.zone,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      minPrice: restaurant.minPrice,
      menus: restaurant.menus.map((m) => ({ id: m.id, name: m.name, price: m.price })),
      partnership: partnershipActive
        ? { endDate: restaurant.partnershipEndDate, info: restaurant.partnershipInfo }
        : null,
    },
  });
}
