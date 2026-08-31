import Link from "next/link";
import { ChevronRight, Menu, Pen, SquarePlus, type LucideIcon } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function MyPage() {
  const user = await requireUser("/mypage");

  const [reviewCount, requestCount, pendingRequestCount] = await Promise.all([
    prisma.review.count({ where: { userId: user.id } }),
    prisma.restaurantRequest.count({ where: { userId: user.id } }),
    prisma.restaurantRequest.count({ where: { userId: user.id, status: "대기" } }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-orange-100 text-[15px] font-bold text-orange-700">
          {user.nickname.slice(0, 1)}
        </div>
        <p className="text-[17px] font-bold text-gray-900">{user.nickname}님</p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-primary"
            >
              관리자
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="pl-0.5 text-xs font-semibold text-gray-400">내 활동</h2>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <ActivityRow href="/mypage/reviews" icon={Pen} label="내 리뷰" value={reviewCount} />
          <RowDivider />
          <ActivityRow
            href="/mypage/requests"
            icon={Menu}
            label="내 제보 내역"
            value={requestCount}
            badge={pendingRequestCount >= 1 ? `대기 ${pendingRequestCount}` : undefined}
          />
          <RowDivider />
          <ActivityRow
            href="/restaurant-requests/new"
            icon={SquarePlus}
            label="식당 제보하기"
            description="지도에 없는 가게를 알려주세요"
            highlight
          />
        </div>
      </section>
    </main>
  );
}

function RowDivider() {
  return <div className="ml-[45px] border-t border-[#f0f0f0]" />;
}

function ActivityRow({
  href,
  icon: Icon,
  label,
  value,
  badge,
  description,
  highlight = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value?: number;
  badge?: string;
  description?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center gap-[11px] px-[14px] py-[15px] transition-colors duration-100",
        highlight
          ? "bg-[#fffaf5] hover:bg-orange-50 active:bg-orange-100"
          : "hover:bg-gray-50 active:bg-gray-100"
      )}
    >
      <Icon
        className={cn("size-5 shrink-0", highlight ? "text-orange-500" : "text-gray-600")}
        strokeWidth={1.8}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", highlight ? "font-bold text-orange-700" : "font-semibold text-gray-800")}>
          {label}
        </p>
        {description && <p className="text-[11px] text-gray-400">{description}</p>}
      </div>
      {badge && (
        <span className="rounded-[5px] bg-orange-50 px-1.5 py-0.5 text-[11px] font-bold text-orange-700">
          {badge}
        </span>
      )}
      {value !== undefined && <span className="text-[13px] text-gray-400">{value}</span>}
      <ChevronRight className="size-4 shrink-0 text-gray-400" />
    </Link>
  );
}
