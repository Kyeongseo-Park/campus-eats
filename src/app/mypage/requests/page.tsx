import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPager } from "@/components/admin-pager";
import { MyRequestCancelButton } from "@/components/my-request-cancel-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS_BADGE_VARIANT } from "@/lib/constants";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 10;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.RestaurantRequestWhereInput = {
    userId: user.id,
    ...(q
      ? {
          OR: [
            { restaurantName: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.restaurantRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.restaurantRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/mypage/requests?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">내 제보 관리</h1>
        <Link href="/mypage" className="text-sm text-primary hover:underline">
          ← 마이페이지
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q" className="text-xs text-muted-foreground">
                식당명 / 주소 / 카테고리 검색
              </Label>
              <Input id="q" name="q" defaultValue={q} placeholder="식당명, 주소 또는 카테고리" className="w-56" />
            </div>
            <Button type="submit" size="sm">
              검색
            </Button>
            {q && (
              <Button nativeButton={false} render={<Link href="/mypage/requests" />} size="sm" variant="ghost">
                초기화
              </Button>
            )}
          </form>
          <Link href="/restaurant-requests/new" className="text-sm text-primary hover:underline">
            식당 제보하기
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          제보 수정은 지원하지 않아요. 내용을 바꾸고 싶다면 대기 중인 제보를 취소한 뒤 새로 제보해주세요.
        </p>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {q ? "검색 결과가 없어요." : "제보한 식당이 없어요."}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {requests.map((req) => (
              <li key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">
                  {req.restaurantName}
                  <span className="ml-1 text-muted-foreground">
                    ({req.address} · {req.category})
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={REQUEST_STATUS_BADGE_VARIANT[req.status] ?? "outline"}>{req.status}</Badge>
                  {req.status === "대기" && (
                    <MyRequestCancelButton requestId={req.id} restaurantName={req.restaurantName} variant="cancel" />
                  )}
                  {req.status === "반려" && (
                    <MyRequestCancelButton requestId={req.id} restaurantName={req.restaurantName} variant="delete" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <AdminPager page={page} totalPages={totalPages} total={total} buildHref={pageHref} />
      </section>
    </main>
  );
}
