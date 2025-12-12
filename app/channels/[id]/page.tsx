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
      next: { revalidate: 300 }, // 5분 캐시
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

    console.error("Channel page error:", error);
    throw error;
  }
}

