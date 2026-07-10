import { PagePlaceholder } from "@/components/page-placeholder";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title="리뷰 수정"
      description={`본인이 작성한 리뷰(${id})를 수정한다. PUT /api/reviews/[id]. 작성자 본인만 가능하다.`}
      features={["별점 (1~5 정수)", "한줄평"]}
    />
  );
}
