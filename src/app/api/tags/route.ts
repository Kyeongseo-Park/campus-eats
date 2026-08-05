import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { order: "asc" },
    select: { id: true, group: true, label: true },
  });

  return NextResponse.json({ tags });
}
