import { CategoryRanking } from "@/components/category/CategoryRanking";
import { CategoryInsights } from "@/components/category/CategoryInsights";
import { AdPlacement } from "@/components/ads/AdPlacement";
import { CATEGORIES } from "@/lib/constants";

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">카테고리별 분석</h1>
        <p className="text-gray-600 dark:text-gray-400">
          카테고리별 유튜브 채널 랭킹 및 인사이트
        </p>
      </div>

      <AdPlacement page="category" location="content-top" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CategoryRanking />
        </div>
        <div>
          <CategoryInsights />
        </div>
      </div>

      <AdPlacement page="category" location="content-bottom" />
    </div>
  );
}



