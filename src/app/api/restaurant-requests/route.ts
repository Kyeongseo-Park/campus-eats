import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const restaurantRequestSchema = z.object({
  restaurantName: z.string().trim().min(1, "식당명을 입력해주세요."),
  address: z.string().trim().min(1, "위치(주소)를 입력해주세요."),
  category: z.enum(CATEGORIES, { message: "카테고리를 선택해주세요." }),
  menuInfo: z.string().trim().max(500, "메뉴 정보는 500자 이하로 입력해주세요.").optional(),
});

// 마이페이지 > 내 제보 확인 (PRD_v2 9번).
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const requests = await prisma.restaurantRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

// 필수: restaurantName, address, category / 선택: menuInfo (PRD_v2 6.1).
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = restaurantRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { restaurantName, address, category, menuInfo } = parsed.data;

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
