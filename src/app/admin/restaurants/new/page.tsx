import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRestaurantForm } from "@/components/admin-restaurant-form";
import { requireAdmin } from "@/lib/auth";

export default async function NewAdminRestaurantPage() {
  await requireAdmin();

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">새 식당 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminRestaurantForm />
        </CardContent>
      </Card>
    </main>
  );
}
