import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Noto_Sans_KR, Geist_Mono } from "next/font/google";
import { UtensilsCrossed } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { PushNotificationsSetup } from "@/components/push-notifications-setup";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "학식 말고 뭐 먹지?",
  description: "학교 주변 식당 정보를 한곳에서 제공하는 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 네이티브 앱에서 푸시 알림 권한을 "로그인한 사용자에게만" 요청하기 위해 필요하다.
  // 토큰은 주인이 있어야 의미가 있어서, 로그인 전에 물어보면 거부율만 높아진다.
  const user = await getCurrentUser();

  return (
    <html
      lang="ko"
      className={`${plusJakartaSans.variable} ${notoSansKR.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <header className="flex shrink-0 items-center border-b px-4 py-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">학식 말고 뭐 먹지?</span>
          </Link>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <BottomTabBar />
        {/* 하단에는 탭바가 있어서 토스트를 위쪽에 띄운다. */}
        <Toaster position="top-center" />
        <PushNotificationsSetup isLoggedIn={Boolean(user)} />
        <Analytics />
      </body>
    </html>
  );
}
