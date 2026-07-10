import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

export async function POST(_request: NextRequest) {
  return notImplemented("POST /auth/login");
}
