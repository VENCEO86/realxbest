"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatNumber } from "@/lib/utils";
import { AdPlacement } from "@/components/ads/AdPlacement";

interface Channel {
  id: string;
  channelId: string;
  channelName: string;
  handle: string | null;
  profileImageUrl: string | null;
  category: { name: string };
  subscriberCount: number;
  weeklySubscriberChangeRate: number;
  weeklyViewCount: number;
  weeklyViewCountChangeRate: number;
  totalViewCount: number;
  averageEngagementRate: number;
  currentRank: number | null;
  rankChange: number;
  lastUpdated: Date;
}

async function fetchRankings(params: URLSearchParams): Promise<{
  channels: Channel[];
  total: number;
}> {
  try {
    const url = `/api/rankings?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 클라이언트 컴포넌트에서는 React Query가 캐싱 처리
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.channels)) {
      throw new Error('잘못된 데이터 형식');
    }

    return data;
  } catch (error) {
    console.error('Rankings fetch error:', error);
    throw error;
  }
}

export function RankingTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category");
  const country = searchParams.get("country");
  
  // 동적 limit 설정: 전체 지역일 때는 더 많이, 카테고리별 최소 100개, 국가별 200개
  let defaultLimit = 100;
  if (country && country !== "all") {
    defaultLimit = 200; // 국가별 필터링 시 200개
  } else if (category && category !== "all") {
    defaultLimit = 100; // 카테고리별 필터링 시 100개
  } else if (country === "all" && (!category || category === "all")) {
    defaultLimit = 500; // 전체 지역 + 전체 카테고리일 때는 500개 (모든 데이터 표시)
  }
  
  const limit = parseInt(searchParams.get("limit") || String(defaultLimit));

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["rankings", searchParams.toString()],
    queryFn: () => fetchRankings(searchParams),
    staleTime: 2 * 60 * 1000, // 2분 캐시
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
            데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.channels.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">순위</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">채널</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">카테고리</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">구독자 수</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">주간 조회수</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">총 조회수</th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">참여율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.channels.map((channel, index) => (
              <React.Fragment key={channel.id || channel.channelId}>
                {/* 중간 광고 칸 (10개마다) */}
                {index > 0 && index % 10 === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4">
                      <AdPlacement page="home" location="content-middle" />
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-2 sm:px-4 py-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-medium text-sm sm:text-base">{channel.currentRank || "-"}</span>
                    {channel.rankChange !== 0 && (
                      <span className={`text-xs whitespace-nowrap ${channel.rankChange > 0 ? "text-green-600" : "text-red-600"}`}>
                        {channel.rankChange > 0 ? "↑" : "↓"} {Math.abs(channel.rankChange)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 min-w-[200px]">
                  <Link
                    href={`/channels/${channel.channelId || channel.id}`}
                    prefetch={true}
                    className="flex items-center gap-2 sm:gap-3 hover:text-blue-600 min-w-0 cursor-pointer"
                  >
                    {channel.profileImageUrl && (
                      <img
                        src={channel.profileImageUrl}
                        alt={channel.channelName}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                        onError={(e) => {
                          
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                          
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate break-words" title={channel.channelName}>
                        {channel.channelName}
                      </div>
                      {channel.handle && (
                        <div className="text-xs sm:text-sm text-gray-500 truncate">@{channel.handle}</div>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 rounded whitespace-nowrap inline-block max-w-full truncate" title={channel.category.name}>
                    {channel.category.name}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="min-w-[80px]">
                    <div className="font-medium text-sm sm:text-base whitespace-nowrap">{formatNumber(Number(channel.subscriberCount))}</div>
                    {channel.weeklySubscriberChangeRate !== 0 && (
                      <div className={`text-xs whitespace-nowrap ${channel.weeklySubscriberChangeRate > 0 ? "text-green-600" : "text-red-600"}`}>
                        {channel.weeklySubscriberChangeRate > 0 ? "+" : ""}
                        {channel.weeklySubscriberChangeRate.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="min-w-[80px]">
                    <div className="font-medium text-sm sm:text-base whitespace-nowrap">{formatNumber(Number(channel.weeklyViewCount))}</div>
                    {channel.weeklyViewCountChangeRate !== 0 && (
                      <div className={`text-xs whitespace-nowrap ${channel.weeklyViewCountChangeRate > 0 ? "text-green-600" : "text-red-600"}`}>
                        {channel.weeklyViewCountChangeRate > 0 ? "+" : ""}
                        {channel.weeklyViewCountChangeRate.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="font-medium text-sm sm:text-base whitespace-nowrap">{formatNumber(Number(channel.totalViewCount))}</div>
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <div className="text-sm sm:text-base whitespace-nowrap">{channel.averageEngagementRate.toFixed(2)}%</div>
                </td>
              </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="text-sm text-gray-600">
          총 {data.total}개 채널
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page - 1));
                await router.push(`/?${params.toString()}`);
                router.refresh();
              } catch (error) {
                console.error("Navigation error:", error);
              }
            }}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer hover:bg-gray-100"
          >
            이전
          </button>
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(page + 1));
                await router.push(`/?${params.toString()}`);
                router.refresh();
              } catch (error) {
                console.error("Navigation error:", error);
              }
            }}
            disabled={page * limit >= data.total}
            className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

