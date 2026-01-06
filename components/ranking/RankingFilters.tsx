"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRIES, REGIONS, getCountriesByRegion } from "@/lib/countries";

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "entertainment", label: "엔터테인먼트" },
  { value: "music", label: "음악" },
  { value: "education", label: "교육" },
  { value: "gaming", label: "게임" },
  { value: "sports", label: "스포츠" },
  { value: "news", label: "뉴스/정치" },
  { value: "people", label: "인물/블로그" },
  { value: "howto", label: "노하우/스타일" },
  { value: "other", label: "기타" },
];

const SORT_OPTIONS = [
  { value: "subscribers", label: "구독자 수 (전체)" },
  { value: "subscribers-weekly", label: "구독자 수 (주간)" },
  { value: "views", label: "조회수 (전체)" },
  { value: "views-weekly", label: "조회수 (주간)" },
  { value: "growth", label: "성장률" },
  { value: "engagement", label: "참여율" },
];

const PERIOD_OPTIONS = [
  { value: "realtime", label: "실시간" },
  { value: "weekly", label: "주간" },
  { value: "monthly", label: "월간" },
];

export function RankingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "subscribers");
  const [period, setPeriod] = useState(searchParams.get("period") || "weekly");
  const [country, setCountry] = useState(searchParams.get("country") || "all");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const handleFilterChange = async (key: string, value: string) => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      await router.push(`/?${params.toString()}`);
      router.refresh();
    } catch (error) {
      console.error("Filter change error:", error);
    }
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    if (region === "all") {
      setCountry("all");
      handleFilterChange("country", "all");
    }
  };

  const availableCountries = selectedRegion === "all" 
    ? COUNTRIES 
    : getCountriesByRegion(selectedRegion);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">국가/지역</label>
          <div className="space-y-2">
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm mb-2"
            >
              {REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                handleFilterChange("country", e.target.value);
              }}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              {availableCountries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleFilterChange("category", e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">정렬 기준</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              handleFilterChange("sortBy", e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">기간</label>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              handleFilterChange("period", e.target.value);
            }}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

