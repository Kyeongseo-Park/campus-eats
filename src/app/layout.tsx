import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Noto_Sans_KR, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { CapacitorAuthBridge } from "@/components/capacitor-auth-bridge";
import { Toaster } from "@/components/ui/sonner";

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
  metadataBase: new URL("https://campus-eats-lime.vercel.app"),
  title: "학식 말고 뭐 먹지?",
  description: "학교 주변 식당 정보를 한곳에서 제공하는 서비스",
  openGraph: {
    title: "학식 말고 뭐 먹지?",
    description: "학교 주변 식당 정보를 한곳에서 제공하는 서비스",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "학식 말고 뭐 먹지?",
    description: "학교 주변 식당 정보를 한곳에서 제공하는 서비스",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${plusJakartaSans.variable} ${notoSansKR.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <header className="flex shrink-0 items-center border-b px-4 py-2">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" className="size-7 shrink-0 rounded-lg" />
            <span className="text-lg font-bold tracking-tight">학식 말고 뭐 먹지?</span>
          </Link>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <BottomTabBar />
        <Analytics />
        <CapacitorAuthBridge />
        <Toaster />
      </body>
    </html>
  );
}
