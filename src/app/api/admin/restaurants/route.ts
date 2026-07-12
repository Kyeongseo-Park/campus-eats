import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, ZONES } from "@/lib/constants";

export type MenuInput = { name: string; price: number };

export function parseMenus(value: unknown): MenuInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const menus: MenuInput[] = [];
  for (const item of value) {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    const price = Number(item?.price);
    if (!name || !Number.isFinite(price) || price < 0) return null;
    menus.push({ name, price });
  }
  return menus;
}

export function parseRestaurantBody(body: unknown) {
  const b = body as Record<string, unknown> | null;

  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const category = typeof b?.category === "string" ? b.category : "";
  const zone = typeof b?.zone === "string" ? b.zone : "";
  const address = typeof b?.address === "string" ? b.address.trim() : "";
  const phoneRaw = typeof b?.phone === "string" ? b.phone.trim() : "";
  const latitude = Number(b?.latitude);
  const longitude = Number(b?.longitude);
  const menus = parseMenus(b?.menus);

  if (!name || !address) return { error: "식당명과 주소를 입력해주세요." } as const;
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "올바르지 않은 카테고리입니다." } as const;
  }
  if (!ZONES.includes(zone as (typeof ZONES)[number])) {
    return { error: "올바르지 않은 구역입니다." } as const;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: "위도/경도를 올바르게 입력해주세요." } as const;
  }
  if (!menus) {
    return { error: "메뉴를 최소 1개 이상 입력해주세요 (메뉴명, 가격)." } as const;
  }

  return {
    data: {
      name,
      category,
      zone,
      address,
      phone: phoneRaw || null,
      latitude,
      longitude,
      minPrice: Math.min(...menus.map((m) => m.price)),
      menus,
    },
  } as const;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseRestaurantBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { menus, ...restaurantData } = parsed.data;

  const restaurant = await prisma.restaurant.create({
    data: {
      ...restaurantData,
      menus: { create: menus },
    },
    include: { menus: true },
  });

  return NextResponse.json({ restaurant }, { status: 201 });
}
