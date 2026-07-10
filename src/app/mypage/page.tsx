import { PagePlaceholder } from "@/components/page-placeholder";

export default function MyPage() {
  return (
    <PagePlaceholder
      title="마이페이지"
      description="로그인한 사용자의 개인 정보 화면."
      features={[
        "내 리뷰 목록",
        "즐겨찾기 목록 (클릭 시 식당 상세로 이동)",
        "내 제보 목록 및 상태 확인 (대기/승인/반려)",
      ]}
    />
  );
}
