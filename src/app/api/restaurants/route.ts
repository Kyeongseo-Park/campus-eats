import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    restaurants: restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      zone: r.zone,
      minPrice: r.minPrice,
      isPartnershipActive: isPartnershipActive(r.partnershipStartDate, r.partnershipEndDate),
    })),
  });
}
