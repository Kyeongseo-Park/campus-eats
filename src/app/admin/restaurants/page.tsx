import { PagePlaceholder } from "@/components/page-placeholder";

export default function AdminRestaurantsPage() {
  return (
    <PagePlaceholder
      title="관리자 - 식당 관리"
      description="식당 추가/수정/삭제. POST/PUT/DELETE /api/admin/restaurants."
      features={["식당 추가", "식당 수정", "식당 삭제"]}
    />
  );
}
