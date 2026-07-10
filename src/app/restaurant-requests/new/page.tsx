import { PagePlaceholder } from "@/components/page-placeholder";

export default function NewRestaurantRequestPage() {
  return (
    <PagePlaceholder
      title="식당 제보"
      description="신규 식당 등록을 요청한다. POST /api/restaurant-requests. 로그인한 사용자만 가능하다."
      features={[
        "식당명 * / 위치(주소) * / 카테고리 * (필수)",
        "메뉴 / 가격 (선택)",
        "등록 후 마이페이지 > 내 제보에서 상태 확인",
      ]}
    />
  );
}
