import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "유튜브 순위 TOP 100 - 실시간 랭킹",
  description: "유튜브 채널 순위, 구독자 수, 조회수 실시간 조회 및 분석",
  keywords: ["유튜브 순위", "유튜브 랭킹", "유튜버 순위", "유튜브 채널 분석"],
  openGraph: {
    title: "유튜브 순위 TOP 100",
    description: "유튜브 채널 순위, 구독자 수, 조회수 실시간 조회",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}


