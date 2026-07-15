import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantRequestForm } from "@/components/restaurant-request-form";
import { requireUser } from "@/lib/auth";

export default async function NewRestaurantRequestPage() {
  await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">식당 제보</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantRequestForm />
        </CardContent>
      </Card>
    </main>
  );
}
