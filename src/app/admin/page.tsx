import { PagePlaceholder } from "@/components/page-placeholder";

export default function AdminDashboardPage() {
  return (
    <PagePlaceholder
      title="관리자 대시보드"
      description="role이 admin인 사용자만 접근 가능. 회원, 식당, 리뷰, 제보를 관리한다."
      features={[
        "회원 관리 → /admin/users",
        "식당 관리 → /admin/restaurants",
        "리뷰 관리 → /admin/reviews",
        "식당 제보 관리 → /admin/requests",
      ]}
    />
  );
}
