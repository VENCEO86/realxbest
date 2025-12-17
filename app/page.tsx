import { Suspense } from "react";
import { RankingTable } from "@/components/ranking/RankingTable";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { AdPlacement } from "@/components/ads/AdPlacement";
import { ChannelSearchBar } from "@/components/ranking/ChannelSearchBar";
import { getMainPageConfig } from "@/lib/main-page";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const config = await getMainPageConfig();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{config.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {config.description}
        </p>
      </div>

      <AdPlacement page="home" location="content-top" />

      {/* 검색 바 */}
      <ChannelSearchBar />

      <Suspense fallback={
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      }>
        <RankingFilters />
      </Suspense>

      <Suspense fallback={
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">랭킹 데이터를 불러오는 중...</p>
        </div>
      }>
        <RankingTable />
      </Suspense>

      <AdPlacement page="home" location="content-bottom" />
    </div>
  );
}

