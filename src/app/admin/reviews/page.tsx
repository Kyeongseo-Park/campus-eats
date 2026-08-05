import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminReviewDeleteButton } from "@/components/admin-review-delete-button";
import { AdminPager } from "@/components/admin-pager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

const TABS = [
  { value: "all", label: "전체" },
  { value: "reported", label: "신고접수" },
  { value: "filtered", label: "자동필터링" },
] as const;
type Tab = (typeof TABS)[number]["value"];

const SORT_OPTIONS = [
  { value: "recent", label: "최신순" },
  { value: "helpful", label: "추천순" },
] as const;
type Sort = (typeof SORT_OPTIONS)[number]["value"];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseTab(value: string | undefined): Tab {
  return value === "reported" || value === "filtered" ? value : "all";
}

function parseSort(value: string | undefined): Sort {
  return value === "helpful" ? "helpful" : "recent";
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin("/admin/reviews");
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);
  const tab = parseTab(firstParam(sp.tab));
  const sort = parseSort(firstParam(sp.sort));

  const tabFilter: Prisma.ReviewWhereInput =
    tab === "reported" ? { reports: { some: {} } } : tab === "filtered" ? { containsProfanity: true } : {};

  const where: Prisma.ReviewWhereInput = {
    ...tabFilter,
    ...(q
      ? {
          OR: [
            { restaurant: { name: { contains: q, mode: "insensitive" } } },
            { user: { nickname: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
    sort === "helpful" ? [{ helpfulVotes: { _count: "desc" } }, { createdAt: "desc" }] : [{ createdAt: "desc" }];

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { nickname: true } },
        restaurant: { select: { id: true, name: true } },
        _count: { select: { helpfulVotes: true, reports: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: { page?: number; tab?: Tab; sort?: Sort }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("tab", overrides.tab ?? tab);
    params.set("sort", overrides.sort ?? sort);
    params.set("page", String(overrides.page ?? page));
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
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <Button
              key={t.value}
              nativeButton={false}
              render={<Link href={buildHref({ tab: t.value, page: 1 })} />}
              size="sm"
              variant={tab === t.value ? "default" : "outline"}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="sort" value={sort} />
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
              <Button
                nativeButton={false}
                render={<Link href={buildHref({ page: 1 })} />}
                size="sm"
                variant="ghost"
              >
                초기화
              </Button>
            )}
          </form>

          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((s) => (
              <Button
                key={s.value}
                nativeButton={false}
                render={<Link href={buildHref({ sort: s.value, page: 1 })} />}
                size="sm"
                variant={sort === s.value ? "default" : "outline"}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">조건에 맞는 리뷰가 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">작성자</th>
                  <th className="p-3 font-medium">식당명</th>
                  <th className="p-3 font-medium">별점</th>
                  <th className="p-3 font-medium">내용</th>
                  <th className="p-3 font-medium">상태</th>
                  <th className="p-3 font-medium">추천</th>
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
                    {/* 관리자는 판단을 위해 마스킹 없이 원문을 그대로 본다 */}
                    <td className="p-3 max-w-xs truncate">{review.content}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        {review._count.reports > 0 && (
                          <Badge variant="destructive">신고됨 {review._count.reports}</Badge>
                        )}
                        {review.containsProfanity && <Badge variant="outline">필터링됨</Badge>}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">{review._count.helpfulVotes}</td>
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

        <AdminPager page={page} totalPages={totalPages} total={total} buildHref={(p) => buildHref({ page: p })} />
      </section>
    </main>
  );
}
