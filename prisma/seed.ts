import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";
import { SCHOOL_MAIN_GATE } from "@/lib/constants";
import { guessCategory } from "@/lib/kakao-category";
import { searchNearbyKakaoPlaces } from "@/lib/kakao-local";

// 캠퍼스 주변 카카오 검색 결과로 Restaurant 테이블을 채운다. kakaoPlaceId 기준 upsert라 재실행해도 안전하다.
// zone(구역)은 카카오 데이터에 없어 일단 "정문"으로 채워두고, 관리자 화면(식당 관리)에서 실제 구역/최저가를
// 보완해야 한다 — /api/kakao/restaurants가 하던 "카카오 기본 정보 + 관리자가 나머지 보완" 원칙과 동일하다.
const DEFAULT_ZONE = "정문";

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const places = await searchNearbyKakaoPlaces(SCHOOL_MAIN_GATE);
  console.log(`카카오에서 ${places.length}개 매장을 찾았습니다.`);

  for (const place of places) {
    const data = {
      name: place.name,
      category: guessCategory(place.category) ?? place.category.split(" > ").at(-1) ?? "기타",
      address: place.roadAddress || place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      phone: place.phone || null,
    };

    await prisma.restaurant.upsert({
      where: { kakaoPlaceId: place.kakaoPlaceId },
      create: { ...data, zone: DEFAULT_ZONE, kakaoPlaceId: place.kakaoPlaceId },
      update: data,
    });
  }

  console.log(`완료: ${places.length}건 저장(신규 생성/기존 업데이트 모두 포함).`);
  console.log("구역(zone)·최저가(minPrice)는 관리자 > 식당 관리 화면에서 직접 보완해주세요.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
