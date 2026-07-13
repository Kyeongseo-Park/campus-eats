import { NextResponse } from "next/server";

// PRD_v2 13번 API 개요에 정의된 엔드포인트 스캐폴드용 placeholder.
// 실제 비즈니스 로직 구현 전까지 사용한다.
export function notImplemented(endpoint: string) {
  return NextResponse.json(
    { error: `Not implemented: ${endpoint}` },
    { status: 501 },
  );
}
