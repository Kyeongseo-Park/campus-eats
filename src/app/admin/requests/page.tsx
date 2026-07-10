import { PagePlaceholder } from "@/components/page-placeholder";

export default function AdminRequestsPage() {
  return (
    <PagePlaceholder
      title="관리자 - 식당 제보 관리"
      description="제보 목록 조회, 내용 수정(카테고리 등) 후 승인/반려. PATCH /api/admin/requests/[id]."
      features={["제보 목록 조회", "제보 내용 수정", "승인 시 DB 등록 / 반려"]}
    />
  );
}
