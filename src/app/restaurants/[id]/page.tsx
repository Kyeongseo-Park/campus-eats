export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex flex-1 flex-col p-8">
      <h1 className="text-2xl font-semibold">식당 상세</h1>
      <p className="text-muted-foreground">id: {id}</p>
    </main>
  );
}
