import { PagePlaceholder } from "@/components/page-placeholder";

export default function FavoritesPage() {
  return (
    <PagePlaceholder
      title="찜한 식당"
      description="즐겨찾기한 식당 목록. 개수 제한 없음. 항목 클릭 시 해당 식당 상세 페이지로 이동."
      features={[
        "찜한 식당 목록 조회",
        "식당명 클릭 시 상세 페이지로 이동",
        "하단 탭바 '찜' 탭과 연동",
      ]}
    />
  );
}
