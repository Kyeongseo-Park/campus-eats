import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { searchKakaoPlaces } from "@/lib/kakao-local";

// 관리자 전용: 식당 등록/승인 폼에서 카카오 로컬 API로 장소를 검색해 기본 정보(이름/주소/좌표/전화번호)를
// 가져오기 위한 서버 프록시. REST API 키를 클라이언트에 노출하지 않기 위해 이 라우트를 거친다.
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ error: "검색어를 입력해주세요." }, { status: 400 });
  }

  try {
    const places = await searchKakaoPlaces(query);
    return NextResponse.json({ places });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "카카오 장소 검색에 실패했습니다." }, { status: 502 });
  }
}
