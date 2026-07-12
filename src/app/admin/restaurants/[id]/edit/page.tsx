import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRestaurantForm } from "@/components/admin-restaurant-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditAdminRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({ where: { id }, include: { menus: true } });
  if (!restaurant) notFound();

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{restaurant.name} 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminRestaurantForm
            initialValues={{
              id: restaurant.id,
              name: restaurant.name,
              category: restaurant.category,
              zone: restaurant.zone,
              address: restaurant.address,
              phone: restaurant.phone ?? "",
              latitude: String(restaurant.latitude),
              longitude: String(restaurant.longitude),
              menus: restaurant.menus.map((m) => ({ name: m.name, price: String(m.price) })),
              partnershipStartDate: restaurant.partnershipStartDate
                ? restaurant.partnershipStartDate.toISOString().slice(0, 10)
                : "",
              partnershipEndDate: restaurant.partnershipEndDate
                ? restaurant.partnershipEndDate.toISOString().slice(0, 10)
                : "",
              partnershipInfo: restaurant.partnershipInfo ?? "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
