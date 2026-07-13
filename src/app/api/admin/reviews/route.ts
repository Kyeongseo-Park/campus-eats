import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 관리자 - 리뷰 관리: 조회 (PRD_v2 9번).
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { id: true, nickname: true, email: true } },
      restaurant: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}
