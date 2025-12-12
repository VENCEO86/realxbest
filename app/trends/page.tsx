import { TrendAnalysis } from "@/components/trends/TrendAnalysis";
import { TrendReport } from "@/components/trends/TrendReport";
import { AdPlacement } from "@/components/ads/AdPlacement";

export default function TrendsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">트렌드 분석</h1>
        <p className="text-gray-600 dark:text-gray-400">
          유튜브 채널 트렌드 및 급상승 분석
        </p>
      </div>

      <AdPlacement page="trends" location="content-top" />

      <TrendAnalysis />
      <TrendReport />

      <AdPlacement page="trends" location="content-bottom" />
    </div>
  );
}


