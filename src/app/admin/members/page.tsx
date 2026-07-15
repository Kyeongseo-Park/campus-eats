import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPager } from "@/components/admin-pager";
import { AdminResetPasswordButton } from "@/components/admin-reset-password-button";
import { AdminRoleToggleButton } from "@/components/admin-role-toggle-button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const currentUser = await requireAdmin();
  const sp = await searchParams;

  const q = firstParam(sp.q) || "";
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where: Prisma.UserWhereInput = q
    ? { OR: [{ nickname: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
    : {};

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, nickname: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/admin/members?${params.toString()}`;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-heading font-semibold">회원 관리</h1>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← 관리자 대시보드
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q" className="text-xs text-muted-foreground">
              닉네임 / 이메일 검색
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder="닉네임 또는 이메일" className="w-56" />
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
          {q && (
            <Button nativeButton={false} render={<Link href="/admin/members" />} size="sm" variant="ghost">
              초기화
            </Button>
          )}
        </form>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">조건에 맞는 회원이 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">닉네임</th>
                  <th className="p-3 font-medium">이메일</th>
                  <th className="p-3 font-medium">역할</th>
                  <th className="p-3 font-medium">가입일</th>
                  <th className="p-3 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t">
                    <td className="p-3 font-medium">{member.nickname}</td>
                    <td className="p-3">{member.email}</td>
                    <td className="p-3">
                      {member.role === "admin" ? (
                        <Badge variant="secondary">admin</Badge>
                      ) : (
                        <span className="text-muted-foreground">user</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">{member.createdAt.toLocaleDateString("ko-KR")}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AdminResetPasswordButton memberId={member.id} memberNickname={member.nickname} />
                        {member.id !== currentUser.id && (
                          <AdminRoleToggleButton
                            memberId={member.id}
                            memberNickname={member.nickname}
                            role={member.role}
                          />
                        )}
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
