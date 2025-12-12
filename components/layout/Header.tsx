import Link from "next/link";
import { AdPlacement } from "@/components/ads/AdPlacement";
import { AdminAuthButton } from "@/components/layout/AdminAuthButton";

export function Header() {
  return (
    <header className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" prefetch={true} className="text-2xl font-bold cursor-pointer">
            KorYouTube
          </Link>

          <nav className="flex items-center gap-3 md:gap-6 overflow-x-auto scrollbar-hide">
            <Link href="/collaborations" prefetch={true} className="hover:text-blue-600 cursor-pointer whitespace-nowrap text-sm md:text-base">
              협업문의
            </Link>
            <Link href="/" prefetch={true} className="hover:text-blue-600 cursor-pointer whitespace-nowrap text-sm md:text-base">
              랭킹
            </Link>
            <Link href="/categories" prefetch={true} className="hover:text-blue-600 cursor-pointer whitespace-nowrap text-sm md:text-base">
              카테고리
            </Link>
            <Link href="/trends" prefetch={true} className="hover:text-blue-600 cursor-pointer whitespace-nowrap text-sm md:text-base">
              트렌드
            </Link>
            <Link href="/search" prefetch={true} className="hover:text-blue-600 cursor-pointer whitespace-nowrap text-sm md:text-base">
              검색
            </Link>
            <Link href="/compare" prefetch={true} className="hover:text-blue-600 cursor-pointer whitespace-nowrap text-sm md:text-base">
              비교
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <AdminAuthButton />
          </div>
        </div>
      </div>

      <AdPlacement page="all" location="header" />
    </header>
  );
}

