import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers/Providers";
import { getFaviconConfig } from "@/lib/favicon";

export async function generateMetadata(): Promise<Metadata> {
  // 기본 메타데이터
  const defaultMetadata: Metadata = {
    title: "유튜브 순위 TOP 100 - 실시간 랭킹",
    description: "유튜브 채널 순위, 구독자 수, 조회수 실시간 조회 및 분석",
    keywords: ["유튜브 순위", "유튜브 랭킹", "유튜버 순위", "유튜브 채널 분석"],
    openGraph: {
      title: "유튜브 순위 TOP 100",
      description: "유튜브 채널 순위, 구독자 수, 조회수 실시간 조회",
      type: "website",
    },
  };

  // 파비콘 설정 가져오기
  const faviconConfig = await getFaviconConfig();
  
  // 파비콘 링크 생성
  const iconArray: Array<{ url: string; sizes?: string; type?: string }> = [];
  if (faviconConfig?.favicon16) {
    iconArray.push({ url: faviconConfig.favicon16, sizes: "16x16", type: "image/png" });
  }
  if (faviconConfig?.favicon32) {
    iconArray.push({ url: faviconConfig.favicon32, sizes: "32x32", type: "image/png" });
  }
  if (faviconConfig?.favicon48) {
    iconArray.push({ url: faviconConfig.favicon48, sizes: "48x48", type: "image/png" });
  }

  const icons: Metadata["icons"] = {};
  if (iconArray.length > 0) {
    icons.icon = iconArray;
  }
  if (faviconConfig?.appleTouchIcon) {
    icons.apple = faviconConfig.appleTouchIcon;
  }

  return {
    ...defaultMetadata,
    icons: Object.keys(icons).length > 0 ? icons : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <FaviconLinks />
      </head>
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

// 서버 컴포넌트로 파비콘 링크 렌더링
async function FaviconLinks() {
  const faviconConfig = await getFaviconConfig();
  
  if (!faviconConfig) return null;

  return (
    <>
      {faviconConfig.favicon16 && (
        <link rel="icon" type="image/png" sizes="16x16" href={faviconConfig.favicon16} />
      )}
      {faviconConfig.favicon32 && (
        <link rel="icon" type="image/png" sizes="32x32" href={faviconConfig.favicon32} />
      )}
      {faviconConfig.favicon48 && (
        <link rel="icon" type="image/png" sizes="48x48" href={faviconConfig.favicon48} />
      )}
      {faviconConfig.appleTouchIcon && (
        <link rel="apple-touch-icon" sizes="180x180" href={faviconConfig.appleTouchIcon} />
      )}
    </>
  );
}



