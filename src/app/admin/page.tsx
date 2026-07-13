import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const [restaurantCount, memberCount, reviewCount, pendingRequestCount, pendingPasswordRequestCount] =
    await Promise.all([
      prisma.restaurant.count(),
      prisma.user.count(),
      prisma.review.count(),
      prisma.restaurantRequest.count({ where: { status: "대기" } }),
      prisma.passwordResetRequest.count({ where: { status: "대기" } }),
    ]);

  const sections = [
    { href: "/admin/restaurants", title: "식당 관리", description: "식당 등록·수정·삭제, 제휴이벤트", count: restaurantCount },
    { href: "/admin/members", title: "회원 관리", description: "회원 조회", count: memberCount },
    { href: "/admin/reviews", title: "리뷰 관리", description: "리뷰 조회·삭제", count: reviewCount },
    { href: "/admin/requests", title: "식당 제보 관리", description: "승인 대기 중인 제보", count: pendingRequestCount },
    {
      href: "/admin/password-requests",
      title: "문의 관리",
      description: "비밀번호 재설정 문의",
      count: pendingPasswordRequestCount,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">관리자 대시보드</h1>
        <p className="mt-2 text-muted-foreground">{user.nickname}님, 관리자 권한으로 접속했습니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.description}</p>
                <p className="mt-2 text-2xl font-semibold">{section.count.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
