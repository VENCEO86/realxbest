import { notFound } from "next/navigation";
import { ChannelHeader } from "@/components/channel/ChannelHeader";
import { GrowthChart } from "@/components/channel/GrowthChart";
import { RecentVideos } from "@/components/channel/RecentVideos";
import { ChannelInsights } from "@/components/channel/ChannelInsights";
import { AdPlacement } from "@/components/ads/AdPlacement";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

async function getChannel(id: string) {
  try {
    // API를 통해 채널 데이터 가져오기
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/api/channels/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const channel = await response.json();
    return channel;
  } catch (error) {
    console.error("Error fetching channel:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const channel = await getChannel(params.id);
  if (!channel) return {};

  return {
    title: `${channel.channelName} - 유튜브 채널 분석`,
    description: `${channel.channelName}의 구독자 수, 조회수, 성장 추이 분석`,
    openGraph: {
      title: `${channel.channelName} - 유튜브 채널 분석`,
      description: `구독자 ${channel.subscriberCount.toLocaleString()}명, 조회수 ${channel.totalViewCount.toLocaleString()}회`,
      images: channel.profileImageUrl ? [channel.profileImageUrl] : [],
    },
  };
}

export default async function ChannelPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const channel = await getChannel(params.id);

    if (!channel) {
      notFound();
    }

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/channels/[id]/page.tsx:59',message:'채널 페이지 렌더링',data:{hasChannel:!!channel,hasGrowthData:!!channel?.growthData,growthDataCount:channel?.growthData?.length || 0,hasVideos:!!channel?.videos,videosCount:channel?.videos?.length || 0,hasWeeklySubscriberChangeRate:typeof channel?.weeklySubscriberChangeRate !== 'undefined',weeklySubscriberChangeRate:channel?.weeklySubscriberChangeRate,hasWeeklyViewCountChangeRate:typeof channel?.weeklyViewCountChangeRate !== 'undefined',weeklyViewCountChangeRate:channel?.weeklyViewCountChangeRate,hasAverageEngagementRate:typeof channel?.averageEngagementRate !== 'undefined',averageEngagementRate:channel?.averageEngagementRate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

    // 데이터 검증 및 기본값 설정
    const safeChannel = {
      ...channel,
      growthData: Array.isArray(channel.growthData) ? channel.growthData : [],
      videos: Array.isArray(channel.videos) ? channel.videos : [],
      weeklySubscriberChangeRate: typeof channel.weeklySubscriberChangeRate === 'number' ? channel.weeklySubscriberChangeRate : 0,
      weeklyViewCountChangeRate: typeof channel.weeklyViewCountChangeRate === 'number' ? channel.weeklyViewCountChangeRate : 0,
      averageEngagementRate: typeof channel.averageEngagementRate === 'number' ? channel.averageEngagementRate : 0,
      currentRank: channel.currentRank ?? null,
      rankChange: typeof channel.rankChange === 'number' ? channel.rankChange : 0,
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <ChannelHeader channel={safeChannel} />

        <AdPlacement page="channel" location="content-top" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <GrowthChart growthData={safeChannel.growthData} />
            <RecentVideos videos={safeChannel.videos} />
          </div>
          <div>
            <ChannelInsights channel={safeChannel} />
          </div>
        </div>

        <AdPlacement page="channel" location="content-bottom" />
      </div>
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/channels/[id]/page.tsx:97',message:'채널 페이지 에러',data:{errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack?.substring(0,200) : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    console.error("Channel page error:", error);
    throw error;
  }
}

