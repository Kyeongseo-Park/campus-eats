import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const startDate = parseDate(body?.partnershipStartDate);
  const endDate = parseDate(body?.partnershipEndDate);
  const info = typeof body?.partnershipInfo === "string" ? body.partnershipInfo.trim() : "";

  if (startDate === undefined || endDate === undefined) {
    return NextResponse.json({ error: "시작일/종료일 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json({ error: "종료일은 시작일보다 빠를 수 없습니다." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: {
      partnershipStartDate: startDate,
      partnershipEndDate: endDate,
      partnershipInfo: info || null,
    },
  });

  return NextResponse.json({ restaurant });
}
