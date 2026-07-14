import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
          <Link href="/" className="font-semibold">
            학식 말고 뭐 먹지?
          </Link>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {user ? (
              <>
                <span className="text-muted-foreground">{user.nickname}님</span>
                <Link href="/mypage" className="hover:underline">
                  마이페이지
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="hover:underline">
                    관리자
                  </Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline">
                  로그인
                </Link>
                <Link href="/signup" className="hover:underline">
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
