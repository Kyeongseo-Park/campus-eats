import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 관리자 - 식당 제보 관리: 전체 조회 (PRD_v2 9번).
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const requests = await prisma.restaurantRequest.findMany({
    include: { user: { select: { id: true, nickname: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
