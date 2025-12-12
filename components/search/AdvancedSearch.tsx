"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";

export function AdvancedSearch() {
  const [filters, setFilters] = useState({
    category: "all",
    minSubscribers: "",
    maxSubscribers: "",
    minGrowth: "",
  });

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== "all") {
        params.set("category", filters.category);
      }
      if (filters.minSubscribers) {
        params.set("minSubscribers", filters.minSubscribers);
      }
      if (filters.maxSubscribers) {
        params.set("maxSubscribers", filters.maxSubscribers);
      }
      if (filters.minGrowth) {
        params.set("minGrowth", filters.minGrowth);
      }
      // 랭킹 페이지로 리다이렉트
      window.location.href = `/?${params.toString()}`;
    } catch (error) {
      console.error("Advanced search error:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">고급 검색</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">구독자 수 범위</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="최소"
              value={filters.minSubscribers}
              onChange={(e) => setFilters({ ...filters, minSubscribers: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700"
            />
            <input
              type="number"
              placeholder="최대"
              value={filters.maxSubscribers}
              onChange={(e) => setFilters({ ...filters, maxSubscribers: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">최소 성장률 (%)</label>
          <input
            type="number"
            placeholder="예: 10"
            value={filters.minGrowth}
            onChange={(e) => setFilters({ ...filters, minGrowth: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
          />
        </div>

        <button
          onClick={handleSearch}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          검색
        </button>
      </div>
    </div>
  );
}

