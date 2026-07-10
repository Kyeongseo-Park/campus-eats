import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 관리자 전용.
export async function POST(_request: NextRequest) {
  return notImplemented("POST /admin/restaurants");
}
