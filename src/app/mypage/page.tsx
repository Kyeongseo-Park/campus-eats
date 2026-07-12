import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { MyReviewsSection } from "@/components/my-reviews";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REQUEST_STATUS_BADGE_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  대기: "outline",
  승인: "secondary",
  반려: "destructive",
};

export default async function MyPage() {
  const user = await requireUser();

  const [favorites, reviews, requests] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { restaurant: { select: { id: true, name: true, zone: true, category: true } } },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { restaurant: { select: { id: true, name: true } } },
    }),
    prisma.restaurantRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">마이페이지</h1>
        <p className="mt-2 text-muted-foreground">
          {user.nickname}님 ({user.email})
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium">내 리뷰</h2>
        <MyReviewsSection reviews={reviews} />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">내 제보</h2>
          <Link href="/restaurant-requests/new" className="text-sm text-primary hover:underline">
            식당 제보하기
          </Link>
        </div>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">제보한 식당이 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {requests.map((req) => (
              <li key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">
                  {req.restaurantName}
                  <span className="ml-1 text-muted-foreground">
                    ({req.address} · {req.category})
                  </span>
                </span>
                <Badge variant={REQUEST_STATUS_BADGE_VARIANT[req.status] ?? "outline"}>{req.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium">즐겨찾기</h2>
        {favorites.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">즐겨찾기한 식당이 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {favorites.map((favorite) => (
              <li key={favorite.id} className="flex items-center justify-between rounded-lg border p-3">
                <Link href={`/restaurants/${favorite.restaurant.id}`} className="text-sm hover:underline">
                  {favorite.restaurant.name}
                  <span className="ml-1 text-muted-foreground">
                    ({favorite.restaurant.zone} · {favorite.restaurant.category})
                  </span>
                </Link>
                <FavoriteButton restaurantId={favorite.restaurant.id} initialFavorited={true} isLoggedIn={true} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
