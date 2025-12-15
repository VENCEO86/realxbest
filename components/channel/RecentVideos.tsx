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
  // 안전한 데이터 처리 - 최소 5개 표시
  const safeVideos = Array.isArray(videos) ? videos : [];
  const displayCount = Math.max(5, safeVideos.length); // 최소 5개
  const displayedVideos = safeVideos.slice(0, displayCount);

  if (safeVideos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">최근 동영상</h2>
        <p className="text-gray-600 dark:text-gray-400">동영상이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">최근 동영상</h2>
      <div className="space-y-4">
        {displayedVideos.map((video, index) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 sm:gap-6 hover:bg-gray-50 dark:hover:bg-gray-700 p-3 sm:p-4 rounded-lg transition-all duration-200 group"
          >
            {/* 썸네일 - 애니메이션 효과 */}
            {video.thumbnailUrl && (
              <div className="relative flex-shrink-0 w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 overflow-hidden rounded-lg">
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover rounded-lg transition-transform duration-[3000ms] ease-in-out group-hover:scale-110"
                  sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                />
              </div>
            )}
            
            {/* 동영상 정보 */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {format(new Date(video.publishedAt), "yyyy-MM-dd HH:mm:ss")}
                </p>
              </div>
              
              {/* 통계 정보 */}
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>조회수: {formatNumber(Number(video.viewCount))}</span>
                {video.likeCount > 0 && (
                  <span>좋아요: {video.likeCount.toLocaleString()}</span>
                )}
                {video.commentCount > 0 && (
                  <span>댓글: {video.commentCount.toLocaleString()}</span>
                )}
                {video.engagementRate > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">
                    참여율: {video.engagementRate.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            
            {/* 스크랩 버튼 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 스크랩 기능 구현 예정
              }}
              className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2 text-xs sm:text-sm"
              aria-label="영상 스크랩"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span className="hidden sm:inline">영상 스크랩</span>
            </button>
          </a>
        ))}
      </div>
    </div>
  );
}

