import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const reviews = await prisma.review.findMany({
    where: { restaurantId: id },
    include: { user: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}
