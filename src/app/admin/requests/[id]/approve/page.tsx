import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRestaurantForm } from "@/components/admin-restaurant-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";

export default async function ApproveRestaurantRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const request = await prisma.restaurantRequest.findUnique({ where: { id } });
  if (!request) notFound();
  if (request.status !== "대기") notFound();

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">제보 승인 — {request.restaurantName}</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminRestaurantForm
            approveRequestId={request.id}
            reportedMenuInfo={request.menuInfo}
            initialValues={{
              name: request.restaurantName,
              category: CATEGORIES.includes(request.category as (typeof CATEGORIES)[number]) ? request.category : "",
              zone: "",
              address: request.address,
              phone: "",
              latitude: "",
              longitude: "",
              menus: [],
              partnershipStartDate: "",
              partnershipEndDate: "",
              partnershipInfo: "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
