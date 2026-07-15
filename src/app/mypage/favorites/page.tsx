import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPager } from "@/components/admin-pager";
import { FavoriteButton } from "@/components/favorite-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 10;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MyFavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.FavoriteWhereInput = {
    userId: user.id,
    ...(q ? { restaurant: { name: { contains: q, mode: "insensitive" } } } : {}),
  };

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { restaurant: { select: { id: true, name: true, zone: true, category: true } } },
    }),
    prisma.favorite.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/mypage/favorites?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-heading font-semibold">즐겨찾기 관리</h1>
        <Link href="/mypage" className="text-sm text-primary hover:underline">
          ← 마이페이지
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q" className="text-xs text-muted-foreground">
              식당명 검색
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="식당명" className="w-56" />
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
          {q && (
            <Button nativeButton={false} render={<Link href="/mypage/favorites" />} size="sm" variant="ghost">
              초기화
            </Button>
          )}
        </form>

        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">{q ? "검색 결과가 없어요." : "즐겨찾기한 식당이 없어요."}</p>
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
                <FavoriteButton restaurantId={favorite.restaurant.id} initialFavorited={true} isLoggedIn={true} />
              </li>
            ))}
          </ul>
        )}

        <AdminPager page={page} totalPages={totalPages} total={total} buildHref={pageHref} />
      </section>
    </main>
  );
}
