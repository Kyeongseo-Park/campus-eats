import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menus: true, reviews: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당" }, { status: 404 });
  }

  return NextResponse.json({ restaurant });
}
