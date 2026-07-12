import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRestaurantBody } from "@/app/api/admin/restaurants/route";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const existing = await prisma.restaurant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseRestaurantBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { menus, ...restaurantData } = parsed.data;

  // 메뉴는 매번 통째로 교체한다 — 관리자 도구 규모에서 개별 diff보다 단순하고 안전하다.
  const restaurant = await prisma.$transaction(async (tx) => {
    await tx.menu.deleteMany({ where: { restaurantId: id } });
    return tx.restaurant.update({
      where: { id },
      data: { ...restaurantData, menus: { create: menus } },
      include: { menus: true },
    });
  });

  return NextResponse.json({ restaurant });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const existing = await prisma.restaurant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  await prisma.restaurant.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
