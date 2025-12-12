import { Suspense } from "react";
import { RankingTable } from "@/components/ranking/RankingTable";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { AdPlacement } from "@/components/ads/AdPlacement";
import { ChannelSearchBar } from "@/components/ranking/ChannelSearchBar";

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">유튜브 순위 TOP 100</h1>
        <p className="text-gray-600 dark:text-gray-400">
          실시간 유튜브 채널 랭킹 및 분석
        </p>
      </div>

      <AdPlacement page="home" location="content-top" />

      {/* 검색 바 */}
      <ChannelSearchBar />

      <Suspense fallback={<div className="text-center py-8">로딩 중...</div>}>
        <RankingFilters />
      </Suspense>

      <Suspense fallback={<div className="text-center py-8">로딩 중...</div>}>
        <RankingTable />
      </Suspense>

      <AdPlacement page="home" location="content-bottom" />
    </div>
  );
}

