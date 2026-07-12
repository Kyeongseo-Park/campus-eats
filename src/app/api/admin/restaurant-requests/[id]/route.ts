import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRestaurantBody } from "@/app/api/admin/restaurants/route";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const existing = await prisma.restaurantRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 제보입니다." }, { status: 404 });
  }
  if (existing.status !== "대기") {
    return NextResponse.json({ error: "이미 처리된 제보입니다." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const status = (body as Record<string, unknown> | null)?.status;

  if (status === "반려") {
    const requestRecord = await prisma.restaurantRequest.update({
      where: { id },
      data: { status: "반려" },
    });
    return NextResponse.json({ request: requestRecord });
  }

  if (status === "승인") {
    const parsed = parseRestaurantBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { menus, ...restaurantData } = parsed.data;

    const [restaurant] = await prisma.$transaction([
      prisma.restaurant.create({
        data: { ...restaurantData, menus: { create: menus } },
        include: { menus: true },
      }),
      prisma.restaurantRequest.update({ where: { id }, data: { status: "승인" } }),
    ]);

    return NextResponse.json({ restaurant });
  }

  return NextResponse.json({ error: "status는 '승인' 또는 '반려'여야 합니다." }, { status: 400 });
}
