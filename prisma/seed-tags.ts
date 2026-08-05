import "dotenv/config";

import { prisma } from "../src/lib/prisma";

// 리뷰 작성 모달의 키워드 태그 20개 고정값 (PRD 참고, 관리자 화면 없이 코드로만 관리).
// 순서 그대로 노출 order로 사용 — 그룹도 이 배열 순서를 따른다.
const TAGS: { group: string; label: string }[] = [
  { group: "음식", label: "가성비가 좋아요" },
  { group: "음식", label: "양이 많아요" },
  { group: "음식", label: "반찬이 잘 나와요" },
  { group: "음식", label: "재료가 신선해요" },
  { group: "음식", label: "메뉴 종류가 다양해요" },
  { group: "음식", label: "한 끼 구성이 알차요" },
  { group: "매장", label: "매장이 청결해요" },
  { group: "매장", label: "좌석이 편해요" },
  { group: "매장", label: "매장이 넓어요" },
  { group: "매장", label: "화장실이 깨끗해요" },
  { group: "매장", label: "와이파이가 잘 돼요" },
  { group: "서비스", label: "음식이 빨리 나와요" },
  { group: "서비스", label: "친절해요" },
  { group: "서비스", label: "배달·포장이 잘 돼요" },
  { group: "서비스", label: "직접 구워줘요" },
  { group: "이용목적", label: "혼밥하기 좋아요" },
  { group: "이용목적", label: "단체모임 하기 좋아요" },
  { group: "이용목적", label: "공부하기 좋아요" },
  { group: "이용목적", label: "데이트하기 좋아요" },
  { group: "이용목적", label: "조용히 먹기 좋아요" },
];

async function main() {
  for (const [index, tag] of TAGS.entries()) {
    await prisma.tag.upsert({
      where: { label: tag.label },
      update: { group: tag.group, order: index },
      create: { group: tag.group, label: tag.label, order: index },
    });
  }
  console.log(`태그 ${TAGS.length}개 upsert 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
