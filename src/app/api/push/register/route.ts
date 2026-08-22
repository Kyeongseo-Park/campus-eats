import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLATFORMS = ["android", "ios"] as const;
type Platform = (typeof PLATFORMS)[number];

function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && PLATFORMS.includes(value as Platform);
}

/**
 * 네이티브 앱이 발급받은 푸시 토큰을 로그인한 사용자에게 연결한다.
 *
 * 토큰을 기준으로 upsert하는 이유: 같은 기기를 다른 계정으로 로그인하면 FCM/APNs는
 * 같은 토큰을 그대로 주기 때문에, 토큰의 주인을 새 사용자로 옮겨줘야 이전 사용자에게
 * 알림이 잘못 가지 않는다.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { token, platform } = (body ?? {}) as { token?: unknown; platform?: unknown };

  if (typeof token !== "string" || token.trim() === "") {
    return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
  }
  if (!isPlatform(platform)) {
    return NextResponse.json({ error: "지원하지 않는 플랫폼입니다." }, { status: 400 });
  }

  await prisma.deviceToken.upsert({
    where: { token },
    create: { token, platform, userId: user.id },
    update: { platform, userId: user.id },
  });

  return NextResponse.json({ registered: true }, { status: 201 });
}

/** 로그아웃하거나 알림을 끌 때, 이 기기로 더 이상 알림이 가지 않도록 토큰을 지운다. */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { token } = (body ?? {}) as { token?: unknown };
  if (typeof token !== "string" || token.trim() === "") {
    return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
  }

  // 다른 사람의 토큰을 지울 수 없도록 본인 것으로 한정한다.
  await prisma.deviceToken.deleteMany({ where: { token, userId: user.id } });

  return NextResponse.json({ registered: false });
}
