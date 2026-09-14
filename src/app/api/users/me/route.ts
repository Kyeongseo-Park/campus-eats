import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/next-auth";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.role === "admin") {
    return NextResponse.json({ error: "관리자 계정은 이 화면에서 탈퇴할 수 없습니다." }, { status: 403 });
  }

  // Review.userId는 SetNull이라 작성한 리뷰는 남고, 그 외(즐겨찾기/제보/제보수정/
  // 리뷰 도움됨 투표/신고/기기토큰/소셜계정)는 Cascade로 함께 삭제된다.
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirect: false });

  return NextResponse.json({ ok: true });
}
