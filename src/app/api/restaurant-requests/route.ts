import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 필수: restaurantName, address, category / 선택: menuInfo (PRD_v2 6.1).
export async function POST(_request: NextRequest) {
  return notImplemented("POST /restaurant-requests");
}
