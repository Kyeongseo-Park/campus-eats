import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">식당 목록</h1>

      {restaurants.length === 0 ? (
        <p className="text-muted-foreground">등록된 식당이 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardDescription>
                    {restaurant.zone} · {restaurant.category}
                  </CardDescription>
                  {isPartnershipActive(restaurant.partnershipStartDate, restaurant.partnershipEndDate) && (
                    <CardAction>
                      <Badge variant="secondary">제휴</Badge>
                    </CardAction>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {restaurant.minPrice.toLocaleString()}원~
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
