import { notFound } from "next/navigation";
import Link from "next/link";
import { Navigation, Phone, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewSection } from "@/components/review-section";
import { FavoriteButton } from "@/components/favorite-button";
import { RestaurantMap } from "@/components/restaurant-map";
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
            {partnershipActive && <Badge className="border-orange-200 bg-orange-50 text-orange-700">제휴</Badge>}
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
        {restaurant.phone && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="size-3.5" />
            {restaurant.phone}
          </p>
        )}
      </div>

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

      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">메뉴</TabsTrigger>
          <TabsTrigger value="review">리뷰 ({reviews.length})</TabsTrigger>
          <TabsTrigger value="location">위치</TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          {restaurant.menus.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 메뉴가 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {restaurant.menus.map((menu) => (
                <li key={menu.id} className="flex justify-between text-sm">
                  <span>{menu.name}</span>
                  <span className="text-muted-foreground">{menu.price.toLocaleString()}원</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="review">
          <ReviewSection restaurantId={restaurant.id} reviews={reviews} currentUserId={currentUser?.id ?? null} />
        </TabsContent>

        <TabsContent value="location" className="flex flex-col gap-3">
          <div className="h-64 w-full overflow-hidden rounded-lg">
            <RestaurantMap
              restaurants={[
                {
                  id: restaurant.id,
                  name: restaurant.name,
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                },
              ]}
              selectedId={restaurant.id}
            />
          </div>
          <p className="text-sm">{restaurant.address}</p>
          <Button
            nativeButton={false}
            render={
              <a
                href={`https://map.kakao.com/link/to/${encodeURIComponent(restaurant.name)},${restaurant.latitude},${restaurant.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            variant="outline"
            className="w-fit"
          >
            <Navigation className="size-4" />
            카카오맵 길찾기
          </Button>
        </TabsContent>
      </Tabs>
    </main>
  );
}
