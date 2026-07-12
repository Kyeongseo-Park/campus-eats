import { NewReviewPageClient } from "@/components/reviews/new-review-page-client";

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <NewReviewPageClient restaurantId={id} />;
}
