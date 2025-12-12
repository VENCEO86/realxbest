"use client";

import React, { useEffect } from "react";
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

  // 안전한 데이터 처리
  const safeVideos = Array.isArray(videos) ? videos : [];
  const displayCount = 5;
  const [showAll, setShowAll] = React.useState(false);
  const displayedVideos = showAll ? safeVideos : safeVideos.slice(0, displayCount);

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
      <h2 className="text-xl font-bold mb-4">최근 동영상</h2>
      <div className="space-y-4">
        {displayedVideos.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
          >
            {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                width={160}
                height={90}
                className="rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-2 line-clamp-2">{video.title}</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>조회수: {formatNumber(Number(video.viewCount))}</div>
                <div>좋아요: {video.likeCount.toLocaleString()}</div>
                <div>댓글: {video.commentCount.toLocaleString()}</div>
                <div>참여율: {video.engagementRate.toFixed(2)}%</div>
                <div>업로드: {format(new Date(video.publishedAt), "yyyy-MM-dd")}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
      {safeVideos.length > displayCount && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          더보기 ({safeVideos.length - displayCount}개 더)
        </button>
      )}
      {showAll && safeVideos.length > displayCount && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          접기
        </button>
      )}
    </div>
  );
}

