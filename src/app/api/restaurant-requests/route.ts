import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const restaurantName = typeof body?.restaurantName === "string" ? body.restaurantName.trim() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const category = typeof body?.category === "string" ? body.category : "";
  const menuInfo = typeof body?.menuInfo === "string" ? body.menuInfo.trim() : "";

  if (!restaurantName || !address || !category) {
    return NextResponse.json({ error: "식당명, 위치, 카테고리를 입력해주세요." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "올바르지 않은 카테고리입니다." }, { status: 400 });
  }

  const restaurantRequest = await prisma.restaurantRequest.create({
    data: {
      userId: user.id,
      restaurantName,
      address,
      category,
      menuInfo: menuInfo || null,
    },
  });

  return NextResponse.json({ request: restaurantRequest }, { status: 201 });
}
