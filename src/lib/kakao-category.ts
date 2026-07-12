import { CATEGORIES, type Category } from "@/lib/constants";

// 카카오 category_name 예: "음식점 > 한식 > 육류,고기 > 삼겹살", "음식점 > 카페" 등.
// CampusEats CATEGORIES(한식/중식/일식/양식/분식/카페) 중 하나로 대략 매핑한다. 못 찾으면 null(수동 선택).
const KEYWORD_TO_CATEGORY: [string, Category][] = [
  ["카페", "카페"],
  ["디저트", "카페"],
  ["분식", "분식"],
  ["한식", "한식"],
  ["중식", "중식"],
  ["일식", "일식"],
  ["일본식", "일식"],
  ["돈까스", "일식"],
  ["초밥", "일식"],
  ["양식", "양식"],
  ["패스트푸드", "양식"],
  ["피자", "양식"],
];

export function guessCategory(kakaoCategoryName: string): Category | null {
  for (const [keyword, category] of KEYWORD_TO_CATEGORY) {
    if (kakaoCategoryName.includes(keyword)) return category;
  }
  return CATEGORIES.find((category) => kakaoCategoryName.includes(category)) ?? null;
}
