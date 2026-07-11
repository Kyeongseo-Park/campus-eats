import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menus: true },
  });

  if (!restaurant) {
    notFound();
  }

  const partnershipActive = isPartnershipActive(
    restaurant.partnershipStartDate,
    restaurant.partnershipEndDate
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
          {partnershipActive && <Badge variant="secondary">제휴</Badge>}
        </div>
        <p className="mt-1 text-muted-foreground">
          {restaurant.zone} · {restaurant.category}
        </p>
        <p className="text-muted-foreground">{restaurant.address}</p>
      </div>

      <section>
        <h2 className="text-lg font-medium">메뉴</h2>
        {restaurant.menus.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">등록된 메뉴가 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {restaurant.menus.map((menu) => (
              <li key={menu.id} className="flex justify-between text-sm">
                <span>{menu.name}</span>
                <span className="text-muted-foreground">{menu.price.toLocaleString()}원</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {partnershipActive && (
        <section>
          <h2 className="text-lg font-medium">제휴이벤트</h2>
          <p className="mt-2 text-sm">{restaurant.partnershipInfo}</p>
          {restaurant.partnershipEndDate && (
            <p className="text-sm text-muted-foreground">
              {restaurant.partnershipEndDate.toLocaleDateString("ko-KR")}까지
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium">리뷰</h2>
        <p className="mt-2 text-sm text-muted-foreground">리뷰 기능은 준비 중입니다.</p>
      </section>
    </main>
  );
}
