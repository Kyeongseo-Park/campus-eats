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

  // "대기" 상태를 조건에 포함한 조건부 업데이트로 처리한다 — 승인 버튼을 두 탭에서
  // 동시에 눌러도 하나만 실제로 반영되고 나머지는 "이미 처리됨"으로 안전하게 막힌다.
  if (status === "반려") {
    const result = await prisma.restaurantRequest.updateMany({
      where: { id, status: "대기" },
      data: { status: "반려" },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "이미 처리된 제보입니다." }, { status: 409 });
    }
    const requestRecord = await prisma.restaurantRequest.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ request: requestRecord });
  }

  if (status === "승인") {
    const parsed = parseRestaurantBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { menus, ...restaurantData } = parsed.data;

    try {
      const restaurant = await prisma.$transaction(async (tx) => {
        const result = await tx.restaurantRequest.updateMany({
          where: { id, status: "대기" },
          data: { status: "승인" },
        });
        if (result.count === 0) {
          throw new Error("ALREADY_PROCESSED");
        }
        return tx.restaurant.create({
          data: { ...restaurantData, menus: { create: menus } },
          include: { menus: true },
        });
      });

      return NextResponse.json({ restaurant });
    } catch (err) {
      if (err instanceof Error && err.message === "ALREADY_PROCESSED") {
        return NextResponse.json({ error: "이미 처리된 제보입니다." }, { status: 409 });
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "status는 '승인' 또는 '반려'여야 합니다." }, { status: 400 });
}
