import type { Metadata } from "next";
import { Playfair_Display, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

/** 고급스러운 세리프 폰트 (제목용) */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

/** 깔끔한 한국어 본문 폰트 */
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI 마법의 거울 — 스마트 코디 추천",
  description: "AI가 당신의 옷장을 분석하고 완벽한 코디를 추천해드립니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${playfair.variable} ${notoSansKr.variable}`}>
      <body className="antialiased min-h-screen bg-gray-50 font-[family-name:var(--font-noto)]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
