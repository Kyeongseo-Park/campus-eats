import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const reviews = await prisma.review.findMany({
    where: { restaurantId: id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { nickname: true } } },
  });

  return NextResponse.json({ reviews });
}
