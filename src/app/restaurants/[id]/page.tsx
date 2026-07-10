import { PagePlaceholder } from "@/components/page-placeholder";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title={`식당 상세 (${id})`}
      description="메뉴, 가격, 위치, 리뷰를 확인한다. GET /api/restaurants/[id] 로 조회한다."
      features={[
        "메뉴/가격 목록",
        "리뷰 목록 + 리뷰 작성 버튼 (로그인 필요)",
        "위치 확인 (Kakao Map)",
        "즐겨찾기 토글",
      ]}
    />
  );
}
