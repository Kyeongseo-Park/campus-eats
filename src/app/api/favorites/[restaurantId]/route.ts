import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "존재하지 않는 식당입니다." }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: { userId_restaurantId: { userId: user.id, restaurantId } },
    create: { userId: user.id, restaurantId },
    update: {},
  });

  return NextResponse.json({ favorited: true }, { status: 201 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: user.id, restaurantId },
  });

  return NextResponse.json({ favorited: false });
}
