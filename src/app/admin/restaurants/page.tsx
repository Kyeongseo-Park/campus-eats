import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminRestaurantDeleteButton } from "@/components/admin-restaurant-delete-button";
import { AdminPager } from "@/components/admin-pager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPartnershipActive } from "@/lib/partnership";
import { CATEGORIES, ZONES } from "@/lib/constants";
import { formatMinPrice } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

const SELECT_CLASS =
  "h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const zone = firstParam(sp.zone) || "";
  const category = firstParam(sp.category) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.RestaurantWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (zone) where.zone = zone;
  if (category) where.category = category;

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.restaurant.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (zone) params.set("zone", zone);
    if (category) params.set("category", category);
    params.set("page", String(targetPage));
    return `/admin/restaurants?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading font-semibold">식당 관리</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            ← 관리자 대시보드
          </Link>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/restaurants/new" />} size="sm">
          새 식당 등록
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q" className="text-xs text-muted-foreground">
              식당명 검색
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="식당명" className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zone" className="text-xs text-muted-foreground">
              구역
            </Label>
            <select id="zone" name="zone" defaultValue={zone} className={SELECT_CLASS}>
              <option value="">전체</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category" className="text-xs text-muted-foreground">
              카테고리
            </Label>
            <select id="category" name="category" defaultValue={category} className={SELECT_CLASS}>
              <option value="">전체</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
          {(q || zone || category) && (
            <Button nativeButton={false} render={<Link href="/admin/restaurants" />} size="sm" variant="ghost">
              초기화
            </Button>
          )}
        </form>

        {restaurants.length === 0 ? (
          <p className="text-sm text-muted-foreground">조건에 맞는 식당이 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">식당명</th>
                  <th className="p-3 font-medium">구역</th>
                  <th className="p-3 font-medium">카테고리</th>
                  <th className="p-3 font-medium">가격</th>
                  <th className="p-3 font-medium">제휴여부</th>
                  <th className="p-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-t">
                    <td className="p-3 font-medium">{restaurant.name}</td>
                    <td className="p-3">{restaurant.zone}</td>
                    <td className="p-3">{restaurant.category}</td>
                    <td className="p-3 whitespace-nowrap">{formatMinPrice(restaurant.minPrice)}</td>
                    <td className="p-3">
                      {isPartnershipActive(restaurant.partnershipStartDate, restaurant.partnershipEndDate) ? (
                        <Badge variant="secondary">제휴중</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button
                          nativeButton={false}
                          render={<Link href={`/admin/restaurants/${restaurant.id}/edit`} />}
                          size="sm"
                          variant="outline"
                        >
                          수정
                        </Button>
                        <AdminRestaurantDeleteButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPager page={page} totalPages={totalPages} total={total} buildHref={pageHref} />
      </section>
    </main>
  );
}
