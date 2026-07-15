import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPasswordRequestCompleteButton } from "@/components/admin-password-request-complete-button";
import { AdminPager } from "@/components/admin-pager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["대기", "처리완료"] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPasswordRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  // status 파라미터 자체가 없으면(첫 진입) 처리 대기 건부터 보여준다. 빈 문자열(?status=)은 "전체"를 뜻한다.
  const status = "status" in sp ? firstParam(sp.status) ?? "" : "대기";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.PasswordResetRequestWhereInput = status ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.passwordResetRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("page", String(targetPage));
    return `/admin/password-requests?${params.toString()}`;
  }

  function statusHref(targetStatus: string) {
    const params = new URLSearchParams();
    params.set("status", targetStatus);
    return `/admin/password-requests?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">문의 관리</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← 관리자 대시보드
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Button
            nativeButton={false}
            render={<Link href={statusHref("")} />}
            size="sm"
            variant={status === "" ? "default" : "outline"}
          >
            전체
          </Button>
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              nativeButton={false}
              render={<Link href={statusHref(s)} />}
              size="sm"
              variant={status === s ? "default" : "outline"}
            >
              {s}
            </Button>
          ))}
        </div>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">조건에 맞는 문의가 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">이메일</th>
                  <th className="p-3 font-medium">접수일시</th>
                  <th className="p-3 font-medium">상태</th>
                  <th className="p-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t">
                    <td className="p-3 font-medium whitespace-nowrap">{req.email}</td>
                    <td className="p-3 whitespace-nowrap">
                      {req.createdAt.toLocaleString("ko-KR")}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Badge variant={req.status === "처리완료" ? "secondary" : "outline"}>{req.status}</Badge>
                    </td>
                    <td className="p-3">
                      {req.status === "대기" ? (
                        <AdminPasswordRequestCompleteButton requestId={req.id} email={req.email} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
