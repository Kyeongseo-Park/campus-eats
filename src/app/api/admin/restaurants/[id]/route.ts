import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restaurantInputSchema } from "@/lib/validation/restaurant";

// 관리자 전용.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.restaurant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  const parsed = restaurantInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ restaurant });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.restaurant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  await prisma.restaurant.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
