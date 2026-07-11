import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
  mapKakaoDocumentToRestaurantInput,
  type KakaoPlaceDocument,
  type MenuInput,
} from "../src/lib/kakao";

// 실제 학교가 정해지기 전까지 사용하는 더미 데이터.
// Kakao Local API(키워드 검색) 응답과 최대한 비슷한 형태(document + x/y 좌표)로 만들어서,
// 실제 API 호출로 교체할 때 src/lib/kakao.ts의 매핑 함수를 그대로 재사용할 수 있게 했다.
// 메뉴/가격은 Kakao API가 제공하지 않는 정보라 수동으로 붙여넣는다.
type PartnershipInput = { startOffsetDays: number; endOffsetDays: number; info: string };
type Fixture = {
  document: KakaoPlaceDocument;
  menus: MenuInput[];
  partnership?: PartnershipInput;
};

function place(
  name: string,
  categoryName: string,
  addressName: string,
  latitude: number,
  longitude: number
): KakaoPlaceDocument {
  return {
    place_name: name,
    category_name: `음식점 > ${categoryName}`,
    category_group_code: categoryName.includes("카페") ? "CE7" : "FD6",
    address_name: addressName,
    road_address_name: addressName,
    y: String(latitude),
    x: String(longitude),
  };
}

const fixtures: Fixture[] = [
  {
    document: place("정문김밥집", "분식", "정문 상가 1층 101호", 37.5665, 126.978),
    menus: [
      { name: "김밥", price: 3000 },
      { name: "라면", price: 4000 },
      { name: "떡볶이", price: 3500 },
    ],
  },
  {
    document: place("정문돈까스", "일식 > 돈까스", "정문 상가 2층 201호", 37.56655, 126.97805),
    menus: [
      { name: "돈까스", price: 9000 },
      { name: "카레돈까스", price: 9500 },
    ],
    partnership: { startOffsetDays: -3, endOffsetDays: 30, info: "학생증 제시 시 음료 무료 제공" },
  },
  {
    document: place("정문커피", "카페 > 커피전문점", "정문 상가 1층 102호", 37.56645, 126.97795),
    menus: [
      { name: "아메리카노", price: 3000 },
      { name: "카페라떼", price: 4000 },
    ],
  },
  // 주점 카테고리 — PRD 6.2 규칙에 따라 수집 대상에서 제외되어야 한다 (아래 필터링 검증용).
  {
    document: place("정문호프", "술집 > 호프,요리주점", "정문 상가 3층 301호", 37.56652, 126.97798),
    menus: [{ name: "생맥주", price: 4000 }],
  },
  {
    document: place("상대설렁탕", "한식 > 육류,고기 > 설렁탕", "상대 후문길 12", 37.5705, 126.979),
    menus: [
      { name: "설렁탕", price: 9000 },
      { name: "수육", price: 15000 },
    ],
  },
  {
    document: place("상대짬뽕", "중식", "상대 후문길 14", 37.57055, 126.97905),
    menus: [
      { name: "짬뽕", price: 8000 },
      { name: "짜장면", price: 7000 },
      { name: "탕수육", price: 18000 },
    ],
  },
  {
    document: place("상대파스타", "양식 > 파스타", "상대 후문길 16", 37.57045, 126.97895),
    menus: [
      { name: "토마토파스타", price: 11000 },
      { name: "리조또", price: 12000 },
    ],
  },
  {
    document: place("예대비빔밥", "한식 > 비빔밥", "예대 골목길 5", 37.5675, 126.983),
    menus: [
      { name: "비빔밥", price: 8000 },
      { name: "된장찌개", price: 7000 },
    ],
  },
  {
    document: place("예대라멘", "일식 > 라멘", "예대 골목길 7", 37.56755, 126.98305),
    menus: [
      { name: "돈코츠라멘", price: 10000 },
      { name: "교자", price: 6000 },
    ],
  },
  {
    document: place("예대베이커리카페", "카페 > 베이커리", "예대 골목길 9", 37.56745, 126.98295),
    menus: [
      { name: "크로플", price: 6000 },
      { name: "아메리카노", price: 3500 },
    ],
    partnership: {
      startOffsetDays: -30,
      endOffsetDays: -5,
      info: "학생증 제시 시 크로플 10% 할인 (종료됨)",
    },
  },
  {
    document: place("후문곱창", "한식 > 육류,고기 > 곱창,막창", "후문 먹자골목 3", 37.5625, 126.977),
    menus: [
      { name: "곱창전골", price: 22000 },
      { name: "막창구이", price: 21000 },
    ],
  },
  {
    document: place("후문마라탕", "중식 > 마라탕", "후문 먹자골목 5", 37.56255, 126.97705),
    menus: [
      { name: "마라탕", price: 9000 },
      { name: "꿔바로우", price: 12000 },
    ],
  },
  {
    document: place("후문돈부리", "일식 > 돈부리", "후문 먹자골목 7", 37.56245, 126.97695),
    menus: [
      { name: "가츠동", price: 8500 },
      { name: "규동", price: 8000 },
    ],
  },
  {
    document: place("공대분식", "분식", "공대쪽문 상가 1호", 37.5655, 126.973),
    menus: [
      { name: "떡볶이", price: 3000 },
      { name: "순대", price: 4000 },
    ],
  },
  {
    document: place("공대국밥", "한식 > 국밥", "공대쪽문 상가 2호", 37.56555, 126.97305),
    menus: [
      { name: "돼지국밥", price: 8000 },
      { name: "순대국밥", price: 8000 },
    ],
    partnership: { startOffsetDays: 10, endOffsetDays: 40, info: "학생증 제시 시 소주 1병 무료 (예정)" },
  },
  {
    document: place("공대양식당", "양식 > 경양식", "공대쪽문 상가 3호", 37.56545, 126.97295),
    menus: [
      { name: "함박스테이크", price: 12000 },
      { name: "오므라이스", price: 9000 },
    ],
  },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  await prisma.menu.deleteMany();
  await prisma.restaurant.deleteMany();

  const now = new Date();
  let created = 0;
  let excluded = 0;

  for (const fixture of fixtures) {
    const restaurantInput = mapKakaoDocumentToRestaurantInput(fixture.document, fixture.menus);

    if (!restaurantInput) {
      excluded++;
      console.log(`제외됨: ${fixture.document.place_name} (${fixture.document.category_name})`);
      continue;
    }

    const minPrice = Math.min(...restaurantInput.menus.map((m) => m.price));

    await prisma.restaurant.create({
      data: {
        name: restaurantInput.name,
        category: restaurantInput.category,
        zone: restaurantInput.zone,
        address: restaurantInput.address,
        latitude: restaurantInput.latitude,
        longitude: restaurantInput.longitude,
        minPrice,
        partnershipStartDate: fixture.partnership ? addDays(now, fixture.partnership.startOffsetDays) : null,
        partnershipEndDate: fixture.partnership ? addDays(now, fixture.partnership.endOffsetDays) : null,
        partnershipInfo: fixture.partnership?.info ?? null,
        menus: { create: restaurantInput.menus },
      },
    });
    created++;
  }

  console.log(`시딩 완료: 식당 ${created}개 생성, ${excluded}개 제외`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
