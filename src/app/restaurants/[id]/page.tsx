import { notFound } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewSection } from "@/components/review-section";
import { FavoriteButton } from "@/components/favorite-button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";
import { calculateAverageRating } from "@/lib/reviews";

// 지도+목록 화면(map-explorer.tsx)에서 "상세보기"로 넘어올 때 함께 전달되는
// 복귀 URL(현재 필터 + 이 식당의 선택 상태 포함). 다른 경로 값이 섞이지 않도록
// 같은 오리진의 절대 경로인지만 확인한다.
function resolveBackHref(from: string | undefined): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return "/";
}

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = resolveBackHref(from);

  const [restaurant, reviews, currentUser] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id }, include: { menus: true } }),
    prisma.review.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { nickname: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!restaurant) {
    notFound();
  }

  const favorite = currentUser
    ? await prisma.favorite.findUnique({
        where: { userId_restaurantId: { userId: currentUser.id, restaurantId: id } },
      })
    : null;

  const partnershipActive = isPartnershipActive(
    restaurant.partnershipStartDate,
    restaurant.partnershipEndDate
  );
  const avgRating = calculateAverageRating(reviews);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
            {partnershipActive && <Badge variant="secondary">제휴</Badge>}
            <FavoriteButton
              restaurantId={restaurant.id}
              initialFavorited={favorite !== null}
              isLoggedIn={!!currentUser}
            />
          </div>
          <Button
            nativeButton={false}
            render={<Link href={backHref} />}
            variant="ghost"
            size="icon"
            aria-label="닫기"
          >
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-muted-foreground">
          {restaurant.zone} · {restaurant.category}
          {avgRating !== null && ` · ★${avgRating.toFixed(1)} (${reviews.length})`}
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
        <div className="mt-2">
          <ReviewSection restaurantId={restaurant.id} reviews={reviews} currentUserId={currentUser?.id ?? null} />
        </div>
      </section>
    </main>
  );
}
