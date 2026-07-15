import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaticStars } from "@/components/star-rating";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS_BADGE_VARIANT } from "@/lib/constants";

const PREVIEW_COUNT = 3;

export default async function MyPage() {
  const user = await requireUser();

  const [reviews, reviewCount, requests, requestCount, favorites, favoriteCount] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: PREVIEW_COUNT,
      include: { restaurant: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.restaurantRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: PREVIEW_COUNT,
    }),
    prisma.restaurantRequest.count({ where: { userId: user.id } }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: PREVIEW_COUNT,
      include: { restaurant: { select: { id: true, name: true, zone: true, category: true } } },
    }),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-heading font-semibold">마이페이지</h1>
        <p className="mt-2 text-muted-foreground">
          {user.nickname}님 ({user.email})
        </p>
        <Link href="/mypage/password" className="mt-1 inline-block text-sm text-primary hover:underline">
          비밀번호 변경
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-subtitle">내 리뷰 ({reviewCount})</CardTitle>
          <Link href="/mypage/reviews" className="flex items-center text-sm text-primary hover:underline">
            전체보기 <ChevronRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">작성한 리뷰가 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {reviews.map((review) => (
                <li key={review.id} className="flex items-center justify-between rounded-md border p-3">
                  <Link href={`/restaurants/${review.restaurant.id}`} className="text-sm font-medium hover:underline">
                    {review.restaurant.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StaticStars rating={review.rating} />
                    <span className="max-w-[10rem] truncate text-sm text-muted-foreground">{review.content}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-subtitle">내 제보 ({requestCount})</CardTitle>
          <Link href="/mypage/requests" className="flex items-center text-sm text-primary hover:underline">
            전체보기 <ChevronRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">제보한 식당이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {requests.map((req) => (
                <li key={req.id} className="flex items-center justify-between rounded-md border p-3">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-subtitle">즐겨찾기 ({favoriteCount})</CardTitle>
          <Link href="/mypage/favorites" className="flex items-center text-sm text-primary hover:underline">
            전체보기 <ChevronRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">즐겨찾기한 식당이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {favorites.map((favorite) => (
                <li key={favorite.id} className="flex items-center justify-between rounded-md border p-3">
                  <Link href={`/restaurants/${favorite.restaurant.id}`} className="text-sm hover:underline">
                    {favorite.restaurant.name}
                    <span className="ml-1 text-muted-foreground">
                      ({favorite.restaurant.zone} · {favorite.restaurant.category})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
