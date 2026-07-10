import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 작성자 본인만 수정/삭제 가능 (PRD_v2 6.1).
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return notImplemented(`PUT /reviews/${id}`);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return notImplemented(`DELETE /reviews/${id}`);
}
