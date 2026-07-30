import { randomInt } from "crypto";

// 캠퍼스 앱 톤 일관성을 위해 고정된 조합 목록 — 임의로 추가/대체하지 않는다.
const NICKNAME_ADJECTIVES = [
  "든든한", "매콤한", "얼큰한", "고소한", "쌉쌀한", "달콤한", "짭짤한", "뜨끈한", "시원한",
  "바삭한", "촉촉한", "쫄깃한", "얼얼한", "출출한", "배고픈", "재빠른", "부지런한", "알찬", "넉넉한",
  "푸짐한", "신속한", "활기찬", "느긋한", "야무진", "씩씩한",
] as const;

const NICKNAME_NOUNS = [
  "학식러", "후문지기", "정문사수꾼", "밥약러", "야식러", "점심러", "저녁러", "간식러",
  "배달러", "맛집헌터", "미식가", "식신", "완밥러", "폭풍흡입러", "도서관지킴이", "동아리방지킴이",
  "새내기", "선배", "복학생", "자취생", "통학러", "알바생", "시험생존자", "조모임러", "밥친구",
] as const;

// "형용사명사_0000" ~ "형용사명사_9999"
export function generateNickname(): string {
  const adjective = NICKNAME_ADJECTIVES[randomInt(NICKNAME_ADJECTIVES.length)];
  const noun = NICKNAME_NOUNS[randomInt(NICKNAME_NOUNS.length)];
  const number = randomInt(10000).toString().padStart(4, "0");
  return `${adjective}${noun}_${number}`;
}
