import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requestStatusLabel } from "@/lib/format";
import type { MyReviewItem, RestaurantRequestItem, SafeUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LoggedInViewProps {
  user: SafeUser;
  reviews: MyReviewItem[] | null;
  requests: RestaurantRequestItem[] | null;
  onLogout: () => void;
}

export function LoggedInView({ user, reviews, requests, onLogout }: LoggedInViewProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
          {user.nickname.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.nickname} 님</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Link href="/restaurant-requests/new" className={cn(buttonVariants({ size: "lg" }), "m-4")}>
        ✍️ 새로운 식당 제보하기
      </Link>

      <Link
        href="/mypage/reviews"
        className="flex items-center justify-between border-b px-4 py-3 hover:bg-muted/50"
      >
        <div>
          <p className="text-sm font-semibold">■ 내 리뷰 관리</p>
          <p className="mt-1 text-sm text-muted-foreground">
            작성한 리뷰 {reviews?.length ?? 0}건
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">■ 내 제보 확인</p>
        {requests === null ? (
          <p className="mt-2 text-sm text-muted-foreground">불러오는 중...</p>
        ) : requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">아직 제보한 식당이 없어요.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {requests.map((request) => (
              <li key={request.id} className="flex items-center justify-between text-sm">
                <span className="truncate">- {request.restaurantName}</span>
                <span className="shrink-0 text-muted-foreground">
                  {requestStatusLabel(request.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="px-4 py-3 text-left text-sm font-semibold text-destructive hover:bg-muted/50"
      >
        ■ 로그아웃
      </button>
    </div>
  );
}
