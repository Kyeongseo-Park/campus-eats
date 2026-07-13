import { NextRequest, NextResponse } from "next/server";

import { getSessionUser, toSafeUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  return NextResponse.json({ user: user ? toSafeUser(user) : null });
}
