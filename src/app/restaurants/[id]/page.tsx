import { RestaurantDetailClient } from "@/components/restaurants/detail/restaurant-detail-client";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RestaurantDetailClient id={id} />;
}
