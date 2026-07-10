import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 관리자 전용.
export async function GET(_request: NextRequest) {
  return notImplemented("GET /admin/requests");
}
