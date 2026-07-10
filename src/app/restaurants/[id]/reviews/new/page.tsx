import { PagePlaceholder } from "@/components/page-placeholder";

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title="리뷰 작성"
      description={`식당(${id})에 대한 리뷰를 등록한다. POST /api/reviews. 로그인한 사용자만 작성 가능하며, 같은 식당에 여러 개 작성할 수 있다.`}
      features={["별점 (1~5 정수)", "한줄평"]}
    />
  );
}
