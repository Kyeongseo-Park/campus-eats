"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { LoggedInView } from "@/components/mypage/logged-in-view";
import { LoggedOutView } from "@/components/mypage/logged-out-view";
import type { MyReviewItem, RestaurantRequestItem } from "@/lib/types";

export default function MyPage() {
  const { status, user, logout } = useSession();
  const [reviews, setReviews] = useState<MyReviewItem[] | null>(null);
  const [requests, setRequests] = useState<RestaurantRequestItem[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();

    fetch("/api/reviews", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { reviews: MyReviewItem[] }) => setReviews(data.reviews ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    fetch("/api/restaurant-requests", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { requests: RestaurantRequestItem[] }) => setRequests(data.requests ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, [status]);

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">마이페이지</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {status === "loading" && (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {status === "unauthenticated" && <LoggedOutView />}
        {status === "authenticated" && user && (
          <LoggedInView user={user} reviews={reviews} requests={requests} onLogout={logout} />
        )}
      </div>
    </div>
  );
}
