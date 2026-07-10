import { NextRequest } from "next/server";

import { notImplemented } from "@/lib/api";

// 관리자 전용. 승인/반려 및 내용 수정(카테고리 등)을 포함한다.
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return notImplemented(`PATCH /admin/requests/${id}`);
}
