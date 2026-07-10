import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 관리자 전용.
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return notImplemented(`PUT /admin/restaurants/${id}`);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return notImplemented(`DELETE /admin/restaurants/${id}`);
}
