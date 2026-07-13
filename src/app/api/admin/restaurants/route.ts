import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restaurantInputSchema } from "@/lib/validation/restaurant";

// 관리자 - 식당 관리: 조회 (PRD_v2 9번).
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ restaurants });
}

// 관리자 전용: 식당 등록.
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const parsed = restaurantInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.create({ data: parsed.data });

  return NextResponse.json({ restaurant }, { status: 201 });
}
