"use client";

import React from "react";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
}

export function RecentVideos({ videos }: { videos: Video[] }) {
  // 안전한 데이터 처리 - 정확히 5개 표시
  const safeVideos = Array.isArray(videos) ? videos : [];
  const displayedVideos = safeVideos.slice(0, 5); // 정확히 최대 5개

  if (safeVideos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">최근 동영상</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">동영상이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">최근 동영상</h2>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {displayedVideos.length}개
        </span>
      </div>
      
      {/* 모바일: 가로 스크롤 카드 형태, 데스크톱: 그리드 형태 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 모바일에서만 가로 스크롤 표시 */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-4">
          <div className="flex gap-4 min-w-max">
            {displayedVideos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-[280px] bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              >
                {/* 썸네일 */}
                {video.thumbnailUrl && (
                  <div className="relative w-full h-40 overflow-hidden">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-[3000ms] ease-in-out group-hover:scale-110"
                      sizes="280px"
                    />
                  </div>
                )}
                
                {/* 동영상 정보 */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {format(new Date(video.publishedAt), "yyyy-MM-dd")}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>조회수: {formatNumber(Number(video.viewCount))}</span>
                    {video.engagementRate > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        참여율: {video.engagementRate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 데스크톱: 그리드 형태 */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 col-span-full">
          {displayedVideos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
            >
              {/* 썸네일 */}
              {video.thumbnailUrl && (
                <div className="relative w-full h-32 lg:h-40 overflow-hidden">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform duration-[3000ms] ease-in-out group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              )}
              
              {/* 동영상 정보 */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {format(new Date(video.publishedAt), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
                
                {/* 통계 정보 */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>조회수: {formatNumber(Number(video.viewCount))}</span>
                  {video.likeCount > 0 && (
                    <span>좋아요: {video.likeCount.toLocaleString()}</span>
                  )}
                  {video.engagementRate > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                      참여율: {video.engagementRate.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

