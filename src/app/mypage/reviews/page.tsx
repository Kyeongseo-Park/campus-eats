import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPager } from "@/components/admin-pager";
import { MyReviewsSection } from "@/components/my-reviews";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 10;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MyReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.ReviewWhereInput = {
    userId: user.id,
    ...(q
      ? { OR: [{ content: { contains: q, mode: "insensitive" } }, { restaurant: { name: { contains: q, mode: "insensitive" } } }] }
      : {}),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { restaurant: { select: { id: true, name: true } } },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/mypage/reviews?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-heading font-semibold">내 리뷰 관리</h1>
        <Link href="/mypage" className="text-sm text-primary hover:underline">
          ← 마이페이지
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q" className="text-xs text-muted-foreground">
              식당명 / 내용 검색
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="식당명 또는 리뷰 내용" className="w-56" />
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
          {q && (
            <Button nativeButton={false} render={<Link href="/mypage/reviews" />} size="sm" variant="ghost">
              초기화
            </Button>
          )}
        </form>

        <MyReviewsSection reviews={reviews} />

        <AdminPager page={page} totalPages={totalPages} total={total} buildHref={pageHref} />
      </section>
    </main>
  );
}
