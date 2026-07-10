import { PagePlaceholder } from "@/components/page-placeholder";

export default function AdminReviewsPage() {
  return (
    <PagePlaceholder
      title="관리자 - 리뷰 관리"
      description="리뷰 조회 및 삭제."
      features={["리뷰 목록 조회", "리뷰 삭제"]}
    />
  );
}
