"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

async function fetchCategoryStats() {
  const response = await fetch("/api/categories/stats");
  if (!response.ok) return [];
  return response.json();
}

export function CategoryInsights() {
  const { data: stats = [] } = useQuery({
    queryKey: ["category-stats"],
    queryFn: fetchCategoryStats,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-bold">카테고리 인사이트</h2>

      {stats.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">카테고리별 평균 구독자 수</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgSubscribers" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">인기 카테고리</h3>
        <div className="space-y-1">
          {stats.slice(0, 5).map((stat: any) => (
            <div key={stat.id} className="flex justify-between text-sm">
              <span>{stat.name}</span>
              <span className="font-medium">{stat.totalChannels}개 채널</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

