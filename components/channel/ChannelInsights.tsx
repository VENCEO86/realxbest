"use client";

import { useEffect } from "react";
import { formatNumber } from "@/lib/utils";

interface Channel {
  id: string;
  channelName: string;
  subscriberCount: number;
  totalViewCount: number;
  videoCount: number;
  averageEngagementRate: number;
  weeklySubscriberChangeRate: number;
  weeklyViewCountChangeRate: number;
  currentRank: number | null;
  rankChange: number;
}

export function ChannelInsights({ channel }: { channel: Channel }) {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/channel/ChannelInsights.tsx:18',message:'ChannelInsights 렌더링',data:{weeklySubscriberChangeRate:channel.weeklySubscriberChangeRate,weeklyViewCountChangeRate:channel.weeklyViewCountChangeRate,averageEngagementRate:channel.averageEngagementRate,currentRank:channel.currentRank},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }, [channel]);
  // #endregion
  
  // 안전한 값 사용
  const weeklySubscriberChangeRate = typeof channel.weeklySubscriberChangeRate === 'number' ? channel.weeklySubscriberChangeRate : 0;
  const weeklyViewCountChangeRate = typeof channel.weeklyViewCountChangeRate === 'number' ? channel.weeklyViewCountChangeRate : 0;
  const averageEngagementRate = typeof channel.averageEngagementRate === 'number' ? channel.averageEngagementRate : 0;
  const totalViewCount = typeof channel.totalViewCount === 'number' ? channel.totalViewCount : 0;
  const videoCount = typeof channel.videoCount === 'number' && channel.videoCount > 0 ? channel.videoCount : 1;
  
  // 예상 수익 계산 (간단한 추정)
  const estimatedRevenue = Math.floor(
    (totalViewCount / 1000) * 0.5 // 1000회당 $0.5 추정
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-bold">인사이트</h2>

      <div>
        <h3 className="font-semibold mb-2">성장률</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">구독자 변화율</span>
            <span
              className={
                weeklySubscriberChangeRate > 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {weeklySubscriberChangeRate > 0 ? "+" : ""}
              {weeklySubscriberChangeRate.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">조회수 변화율</span>
            <span
              className={
                weeklyViewCountChangeRate > 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {weeklyViewCountChangeRate > 0 ? "+" : ""}
              {weeklyViewCountChangeRate.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">순위</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">현재 순위</span>
            <span className="font-bold">{channel.currentRank || "-"}</span>
          </div>
          {channel.rankChange !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">순위 변동</span>
              <span
                className={
                  channel.rankChange > 0 ? "text-green-600" : "text-red-600"
                }
              >
                {channel.rankChange > 0 ? "↑" : "↓"} {Math.abs(channel.rankChange)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">참여 지표</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">평균 참여율</span>
            <span className="font-bold">{averageEngagementRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">평균 조회수</span>
            <span className="font-bold">
              {formatNumber(Math.floor(totalViewCount / videoCount))}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">예상 수익</h3>
        <div className="text-2xl font-bold text-blue-600">
          ${estimatedRevenue.toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 mt-1">* 추정치입니다</p>
      </div>
    </div>
  );
}

