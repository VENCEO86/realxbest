import { AdPlacement } from "@/components/ads/AdPlacement";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-900 mt-auto">
      <AdPlacement page="all" location="footer" />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">KorYouTube</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              유튜브 채널 랭킹 및 분석 플랫폼
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">랭킹</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  전체 랭킹
                </a>
              </li>
              <li>
                <a href="/categories" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  카테고리별
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">분석</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/trends" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  트렌드 분석
                </a>
              </li>
              <li>
                <a href="/search" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  채널 검색
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">정보</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  소개
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 KorYouTube. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


