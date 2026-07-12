"use client";

import { usePathname } from "next/navigation";

import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { TopNav } from "@/components/layout/top-nav";
import { isStandaloneRoute } from "@/lib/nav-items";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isStandaloneRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <TopNav />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomTabBar />
    </>
  );
}
