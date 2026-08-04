import { notFound } from "next/navigation";
import Link from "next/link";
import { Navigation, Phone, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewSection } from "@/components/review-section";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { RestaurantMap } from "@/components/restaurant-map";
import { OpenStatusBadge } from "@/components/open-status-badge";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";
import { DAY_KEYS, DAY_LABELS, formatDayHours, getOpenStatus, type BusinessHours } from "@/lib/business-hours";

// 목록/지도 화면(map-explorer.tsx)에서는 이제 이 페이지로 이동하지 않고 RestaurantDetailModal을
// 바로 연다. 이 페이지는 공유 링크 등으로 직접 접근했을 때를 위해 남아 있다.
export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [restaurant, reviewAgg, currentUser] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id }, include: { menus: true } }),
    prisma.review.aggregate({ where: { restaurantId: id }, _avg: { rating: true }, _count: { _all: true } }),
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
  const avgRating = reviewAgg._avg.rating;
  const reviewCount = reviewAgg._count._all;
  const businessHours = restaurant.businessHours as BusinessHours | null;
  const openStatus = getOpenStatus(businessHours);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
            {partnershipActive && <Badge variant="secondary">제휴</Badge>}
            <OpenStatusBadge status={openStatus} />
            <FavoriteButton
              restaurantId={restaurant.id}
              initialFavorited={favorite !== null}
              isLoggedIn={!!currentUser}
            />
            <ShareButton title={restaurant.name} />
          </div>
          <Button nativeButton={false} render={<Link href="/" />} variant="ghost" size="icon" aria-label="닫기">
            <X className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-muted-foreground">
          {restaurant.zone} · {restaurant.category}
          {avgRating !== null && ` · ★${avgRating.toFixed(1)} (${reviewCount})`}
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
          <TabsTrigger value="review">리뷰 ({reviewCount})</TabsTrigger>
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
          <ReviewSection
            restaurantId={restaurant.id}
            isLoggedIn={!!currentUser}
            currentUserId={currentUser?.id ?? null}
            avgRating={avgRating}
          />
        </TabsContent>

        <TabsContent value="location" className="flex flex-col gap-3">
          <div className="h-64 w-full overflow-hidden rounded-lg">
            <RestaurantMap
              restaurants={[
                {
                  id: restaurant.id,
                  name: restaurant.name,
                  category: restaurant.category,
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                },
              ]}
              selectedId={restaurant.id}
            />
          </div>
          <p className="text-sm">{restaurant.address}</p>
          {businessHours && (
            <ul className="flex flex-col gap-0.5 rounded-md border p-3 text-sm">
              {DAY_KEYS.map((day) => (
                <li key={day} className="flex justify-between">
                  <span className="text-muted-foreground">{DAY_LABELS[day]}</span>
                  <span>{formatDayHours(businessHours[day])}</span>
                </li>
              ))}
            </ul>
          )}
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
