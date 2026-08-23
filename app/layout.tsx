import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import "./globals.css?font-v2";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "数智-红途｜江西红色文旅智能导览平台",
  description: "根据学习主题、体验偏好、出发县区、日期与游览时间，为青年学生与高校实践团队匹配江西全省红色点位和差异化路线。",
  openGraph: {
    title: "数智-红途",
    description: "江西红色文旅智能导览平台",
    images: [{
      url: "https://gitee.com/eddiemarx/shujing-hongtu/raw/main/public/og.png",
      width: 1731,
      height: 909,
      alt: "数智-红途｜江西红色文旅智能导览平台",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "数智-红途",
    description: "江西红色文旅智能导览平台",
    images: ["https://gitee.com/eddiemarx/shujing-hongtu/raw/main/public/og.png"],
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
