import { PagePlaceholder } from "@/components/page-placeholder";

export default function HomePage() {
  return (
    <PagePlaceholder
      title="메인"
      description="서비스 진입 화면. Kakao Map으로 내 위치를 표시하고, 검색 및 구역/카테고리/가격대 필터로 식당 목록 화면으로 이동한다."
      features={[
        "지도 + 내 위치 표시 (Kakao Map API)",
        "식당명/메뉴명 검색",
        "구역/카테고리/가격대 필터",
      ]}
    />
  );
}
