import { EditReviewPageClient } from "@/components/reviews/edit-review-page-client";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditReviewPageClient reviewId={id} />;
}
