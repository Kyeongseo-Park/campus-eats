import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 관리자 - 회원 관리 (PRD_v2 9/10번). role 변경은 DB에서 직접 수행하므로 조회만 제공한다.
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const users = await prisma.user.findMany({
    select: { id: true, email: true, nickname: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
