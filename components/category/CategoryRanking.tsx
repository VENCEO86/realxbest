"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

async function fetchCategoryRanking(category: string) {
  const response = await fetch(`/api/rankings?category=${category}&limit=200`);
  if (!response.ok) return { channels: [], total: 0 };
  return response.json();
}

export function CategoryRanking() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["category-ranking", selectedCategory],
    queryFn: () => fetchCategoryRanking(selectedCategory),
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">카테고리 선택</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">로딩 중...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium">순위</th>
                <th className="px-4 py-3 text-left text-xs font-medium">채널</th>
                <th className="px-4 py-3 text-left text-xs font-medium">구독자</th>
                <th className="px-4 py-3 text-left text-xs font-medium">조회수</th>
                <th className="px-4 py-3 text-left text-xs font-medium">참여율</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.channels?.slice(0, 200).map((channel: any) => (
                <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">{channel.currentRank || "-"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/channels/${channel.id}`}
                      className="hover:text-blue-600"
                    >
                      {channel.channelName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatNumber(channel.subscriberCount)}</td>
                  <td className="px-4 py-3">{formatNumber(channel.totalViewCount)}</td>
                  <td className="px-4 py-3">{channel.averageEngagementRate.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

