import { ChannelSearch } from "@/components/search/ChannelSearch";
import { AdvancedSearch } from "@/components/search/AdvancedSearch";
import { AdPlacement } from "@/components/ads/AdPlacement";

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">채널 검색</h1>
        <p className="text-gray-600 dark:text-gray-400">
          유튜브 채널을 검색하고 분석하세요
        </p>
      </div>

      <AdPlacement page="search" location="content-top" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChannelSearch />
        </div>
        <div>
          <AdvancedSearch />
        </div>
      </div>

      <AdPlacement page="search" location="content-bottom" />
    </div>
  );
}


