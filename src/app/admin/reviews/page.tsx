import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminReviewDeleteButton } from "@/components/admin-review-delete-button";
import { AdminPager } from "@/components/admin-pager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.ReviewWhereInput = q
    ? {
        OR: [
          { restaurant: { name: { contains: q, mode: "insensitive" } } },
          { user: { nickname: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { nickname: true } }, restaurant: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/admin/reviews?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">리뷰 관리</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← 관리자 대시보드
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q" className="text-xs text-muted-foreground">
              식당명 / 작성자 검색
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="식당명 또는 작성자 닉네임" className="w-56" />
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
          {q && (
            <Button nativeButton={false} render={<Link href="/admin/reviews" />} size="sm" variant="ghost">
              초기화
            </Button>
          )}
        </form>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">조건에 맞는 리뷰가 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">작성자</th>
                  <th className="p-3 font-medium">식당명</th>
                  <th className="p-3 font-medium">별점</th>
                  <th className="p-3 font-medium">내용</th>
                  <th className="p-3 font-medium">작성일</th>
                  <th className="p-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{review.user.nickname}</td>
                    <td className="p-3 whitespace-nowrap">
                      <Link href={`/restaurants/${review.restaurant.id}`} className="text-primary hover:underline">
                        {review.restaurant.name}
                      </Link>
                    </td>
                    <td className="p-3 whitespace-nowrap">★{review.rating}</td>
                    <td className="p-3 max-w-xs truncate">{review.content}</td>
                    <td className="p-3 whitespace-nowrap">{review.createdAt.toLocaleDateString("ko-KR")}</td>
                    <td className="p-3">
                      <AdminReviewDeleteButton reviewId={review.id} />
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
