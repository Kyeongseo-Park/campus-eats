import { PagePlaceholder } from "@/components/page-placeholder";

export default function AdminUsersPage() {
  return (
    <PagePlaceholder
      title="관리자 - 회원 관리"
      description="회원 조회 및 관리 (role 변경 포함)."
      features={["회원 목록 조회", "회원 상세/관리"]}
    />
  );
}
