import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Noto_Sans_KR, Geist_Mono } from "next/font/google";
import { UtensilsCrossed } from "lucide-react";
import "./globals.css";

import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

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
  const user = await getCurrentUser();

  return (
    <html
      lang="ko"
      className={`${plusJakartaSans.variable} ${notoSansKR.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">학식 말고 뭐 먹지?</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {user ? (
              <>
                <span className="text-muted-foreground">{user.nickname}님</span>
                <Link href="/mypage" className="font-medium text-muted-foreground transition-colors hover:text-primary">
                  마이페이지
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="font-medium text-muted-foreground transition-colors hover:text-primary">
                    관리자
                  </Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="font-medium text-muted-foreground transition-colors hover:text-primary">
                  로그인
                </Link>
                <Link href="/signup" className="font-medium text-muted-foreground transition-colors hover:text-primary">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </body>
    </html>
  );
}
