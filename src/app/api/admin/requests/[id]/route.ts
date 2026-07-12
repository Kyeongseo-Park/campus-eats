import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restaurantInputSchema } from "@/lib/validation/restaurant";

const approveSchema = z.object({
  action: z.literal("approve"),
  ...restaurantInputSchema.shape,
});

const rejectSchema = z.object({
  action: z.literal("reject"),
});

const patchSchema = z.discriminatedUnion("action", [approveSchema, rejectSchema]);

// 관리자 전용. 승인/반려 및 내용 수정(구역·좌표 등 원본 제보 폼에 없던 값 포함)을 처리한다 (PRD_v2 6.1/7.2).
// RestaurantRequest에는 zone/latitude/longitude가 없으므로, 승인 시 관리자가 이 값들을 채워 Restaurant을 새로 생성한다.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.restaurantRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 제보입니다." }, { status: 404 });
  }
  if (existing.status !== "대기") {
    return NextResponse.json({ error: "이미 처리된 제보입니다." }, { status: 409 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.action === "reject") {
    const requestRecord = await prisma.restaurantRequest.update({
      where: { id },
      data: { status: "반려" },
    });
    return NextResponse.json({ request: requestRecord });
  }

  const { action: _action, ...restaurantData } = parsed.data;

  const [restaurant, requestRecord] = await prisma.$transaction([
    prisma.restaurant.create({ data: restaurantData }),
    prisma.restaurantRequest.update({ where: { id }, data: { status: "승인" } }),
  ]);

  return NextResponse.json({ restaurant, request: requestRecord });
}
