import { ChannelCompare } from "@/components/compare/ChannelCompare";
import { AdPlacement } from "@/components/ads/AdPlacement";

export default function ComparePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">채널 비교</h1>
        <p className="text-gray-600 dark:text-gray-400">
          최대 5개 채널을 동시에 비교 분석하세요
        </p>
      </div>

      <AdPlacement page="compare" location="content-top" />

      <ChannelCompare />

      <AdPlacement page="compare" location="content-bottom" />
    </div>
  );
}


