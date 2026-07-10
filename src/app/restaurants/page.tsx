import { PagePlaceholder } from "@/components/page-placeholder";

export default function RestaurantsPage() {
  return (
    <PagePlaceholder
      title="식당 목록"
      description="검색·필터 결과를 보여준다. GET /api/restaurants 를 zone/category/priceRange/sort 쿼리로 호출한다."
      features={[
        "구역/카테고리/가격대 필터 조합",
        "정렬: 평점순(기본) / 거리순 / 가격순",
        "결과 없음 시 '검색 결과가 없어요. 새로운 식당을 제보해보세요!' 표시",
      ]}
    />
  );
}
