import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 로그인 필요. 한 사용자가 같은 식당에 여러 개 작성 가능 (PRD_v2 6.1).
export async function POST(_request: NextRequest) {
  return notImplemented("POST /reviews");
}
