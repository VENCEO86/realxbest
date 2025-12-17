"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatNumber } from "@/lib/utils";
import { AdPlacement } from "@/components/ads/AdPlacement";
import { Pagination } from "@/components/ranking/Pagination";

interface Channel {
  id: string;
  channelId: string;
  channelName: string;
  name?: string; // 하위 호환성을 위한 선택적 필드
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

async function fetchRankings(params: URLSearchParams, limit: number = 200, page: number = 1): Promise<{
  channels: Channel[];
  total: number;
}> {
  try {
    // limit과 page 파라미터를 명시적으로 추가
    const apiParams = new URLSearchParams(params.toString());
    if (!apiParams.has("limit")) {
      apiParams.set("limit", String(limit));
    }
    if (!apiParams.has("page")) {
      apiParams.set("page", String(page));
    }
    
    const url = `/api/rankings?${apiParams.toString()}`;
    
    // 타임아웃 설정 (60초로 증가 - Render 무료 플랜 spin down 대응)
    // Render 무료 플랜은 첫 요청 시 최대 50초 지연 가능
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      // Render spin down 대응: 첫 요청 시 지연 허용
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data.channels)) {
      throw new Error('잘못된 데이터 형식');
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('요청 시간 초과');
    }
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
  
  // limit 설정: 페이지네이션을 위해 200개씩 고정 (데이터 부족 시 조정)
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "200"), 100), // 최소 100개로 완화
    500 // 최대 500개
  );

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["rankings", searchParams.toString(), limit, page],
    queryFn: () => fetchRankings(searchParams, limit, page),
    staleTime: 2 * 60 * 1000, // 2분 캐시
    retry: 3, // Render spin down 대응: 재시도 횟수 증가
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프 (최대 30초)
    refetchOnWindowFocus: false, // 창 포커스 시 재요청 방지
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
                    {channel.profileImageUrl ? (
                      <img
                        src={channel.profileImageUrl}
                        loading="lazy"
                        decoding="async"
                        alt={channel.channelName || channel.name || "채널"}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 object-cover"
                        onError={(e) => {
                          // 이미지 로드 실패 시 숨김
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      // 프로필 이미지가 없을 때 기본 아바타 표시
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {(channel.channelName || channel.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate break-words" title={channel.channelName || channel.name || ""}>
                        {channel.channelName || channel.name || "이름 없음"}
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

      <Pagination
        currentPage={page}
        totalItems={data.total}
        itemsPerPage={limit}
      />
    </div>
  );
}

