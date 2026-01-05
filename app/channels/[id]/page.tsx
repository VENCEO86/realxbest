import { notFound } from "next/navigation";
import { ChannelHeader } from "@/components/channel/ChannelHeader";
import { GrowthChart } from "@/components/channel/GrowthChart";
import { RecentVideos } from "@/components/channel/RecentVideos";
import { ChannelInsights } from "@/components/channel/ChannelInsights";
import { AdPlacement } from "@/components/ads/AdPlacement";
import { prisma } from "@/lib/prisma";
import { fetchChannelFromYouTubeAPI, fetchChannelVideos } from "@/lib/youtube-api";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS?.split(',')[0] || "";

async function getChannel(id: string) {
  try {
    // 서버 사이드에서는 직접 Prisma 사용 (내부 API 호출 대신)
    const decodedId = decodeURIComponent(id);
    const searchId = decodedId.startsWith('@') ? decodedId.substring(1) : decodedId;
    
    // 1. 데이터베이스에서 조회
    let channel = await prisma.youTubeChannel.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { channelId: decodedId },
          { handle: searchId },
          { handle: decodedId },
        ],
      },
      include: {
        category: true,
        videos: {
          orderBy: { publishedAt: "desc" },
          take: 10,
        },
        growthData: {
          orderBy: { date: "asc" },
          take: 30,
        },
      },
    });
    
    let actualChannelId = decodedId;
    if (channel) {
      actualChannelId = channel.channelId;
    }
    
    // 2. 동영상은 항상 YouTube API에서 최신 데이터 가져오기
    let recentVideos: any[] = [];
    let channelIdForVideos = actualChannelId;
    
    // 핸들인 경우 먼저 채널 ID를 찾아야 함
    if (decodedId.startsWith("@") || (!actualChannelId.startsWith("UC") && channel)) {
      try {
        const searchQuery = decodedId.startsWith("@") ? decodedId.substring(1) : decodedId;
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${YOUTUBE_API_KEY}`
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            channelIdForVideos = searchData.items[0].snippet.channelId;
          }
        }
      } catch (error) {
        // 검색 실패 시 원본 ID 사용
      }
    }
    
    // 동영상 가져오기 (항상 YouTube API에서 최신 데이터)
    // 채널이 있으면 항상 동영상 가져오기 시도
    if (channel && actualChannelId && actualChannelId.startsWith("UC")) {
      try {
        // uploadsPlaylistId 가져오기 (있으면 API 호출 1회 절약)
        let uploadsPlaylistId: string | undefined;
        if ((channel as any).uploadsPlaylistId) {
          uploadsPlaylistId = (channel as any).uploadsPlaylistId;
        } else {
          // uploadsPlaylistId가 없으면 채널 정보에서 가져오기
          try {
            const channelResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`
            );
            if (channelResponse.ok) {
              const channelData = await channelResponse.json();
              if (channelData.items && channelData.items.length > 0) {
                uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
              }
            }
          } catch (error) {
            // uploadsPlaylistId 가져오기 실패해도 계속 진행
          }
        }
        
        console.log(`[getChannel] 동영상 가져오기 시도: ${actualChannelId}`);
        recentVideos = await fetchChannelVideos(actualChannelId, 5, YOUTUBE_API_KEY);
        console.log(`[getChannel] 동영상 가져오기 결과: ${recentVideos.length}개`);
        
        // API 호출 성공했지만 결과가 없으면 DB에서 가져오기 시도
        if (recentVideos.length === 0 && channel && channel.videos && channel.videos.length > 0) {
          console.log(`[getChannel] DB에서 동영상 가져오기: ${channel.videos.length}개`);
          recentVideos = channel.videos.map((v: any) => ({
            id: v.videoId || v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            publishedAt: v.publishedAt,
            viewCount: Number(v.viewCount),
            likeCount: v.likeCount || 0,
            commentCount: v.commentCount || 0,
            engagementRate: v.engagementRate || 0,
          }));
        }
      } catch (error: any) {
        console.error(`[getChannel] 동영상 가져오기 실패:`, error.message || error);
        // API 호출 실패 시 데이터베이스에 있는 동영상 사용 (fallback)
        if (channel && channel.videos && channel.videos.length > 0) {
          console.log(`[getChannel] Fallback: DB에서 동영상 가져오기: ${channel.videos.length}개`);
          recentVideos = channel.videos.map((v: any) => ({
            id: v.videoId || v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            publishedAt: v.publishedAt,
            viewCount: Number(v.viewCount),
            likeCount: v.likeCount || 0,
            commentCount: v.commentCount || 0,
            engagementRate: v.engagementRate || 0,
          }));
        }
      }
    } else {
      // 채널 ID가 없거나 유효하지 않은 경우 DB에서만 가져오기
      if (channel && channel.videos && channel.videos.length > 0) {
        console.log(`[getChannel] DB에서 동영상 가져오기 (채널 ID 없음): ${channel.videos.length}개`);
        recentVideos = channel.videos.map((v: any) => ({
          id: v.videoId || v.id,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          viewCount: Number(v.viewCount),
          likeCount: v.likeCount || 0,
          commentCount: v.commentCount || 0,
          engagementRate: v.engagementRate || 0,
        }));
      }
    }
    
    // 3. growthData가 없으면 생성 (추정 데이터)
    if (channel && (!channel.growthData || channel.growthData.length === 0)) {
      const baseSubscribers = Number(channel.subscriberCount || 0);
      const baseViews = Number(channel.totalViewCount || 0);
      
      if (baseSubscribers > 0 && baseViews > 0) {
        const now = new Date();
        const estimatedGrowthData = [];
        for (let i = 0; i <= 6; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          estimatedGrowthData.push({
            date: date,
            subscriberCount: BigInt(Math.floor(baseSubscribers * (1 - i * 0.001))),
            viewCount: BigInt(Math.floor(baseViews * (1 - i * 0.001))),
          });
        }
        channel.growthData = estimatedGrowthData as any;
        
        if (estimatedGrowthData.length > 1) {
          const first = estimatedGrowthData[0];
          const last = estimatedGrowthData[estimatedGrowthData.length - 1];
          channel.weeklySubscriberChangeRate = ((Number(last.subscriberCount) - Number(first.subscriberCount)) / Number(first.subscriberCount)) * 100;
          channel.weeklyViewCountChangeRate = ((Number(last.viewCount) - Number(first.viewCount)) / Number(first.viewCount)) * 100;
        }
      }
    }
    
    // 4. DB에 없으면 YouTube API로 조회 시도
    if (!channel) {
      let actualChannelId = decodedId;
      
      // 핸들인 경우 YouTube Search API로 채널 ID 찾기
      if (decodedId.startsWith("@") || (!decodedId.startsWith("UC") && decodedId.length > 0)) {
        try {
          const searchQuery = decodedId.startsWith("@") ? decodedId.substring(1) : decodedId;
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${YOUTUBE_API_KEY}`
          );
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
              actualChannelId = searchData.items[0].snippet.channelId;
            }
          }
        } catch (error) {
          // 검색 실패 시 원본 ID 사용
        }
      }
      
      // YouTube Channel ID인 경우 YouTube API 호출
      if (actualChannelId.startsWith("UC") && actualChannelId.length === 24) {
        const youtubeData = await fetchChannelFromYouTubeAPI(actualChannelId, YOUTUBE_API_KEY);
        if (youtubeData) {
          const defaultCategory = await prisma.category.findFirst({
            where: { name: "기타" },
          });
          
          const fallbackVideos = await fetchChannelVideos(actualChannelId, 5, YOUTUBE_API_KEY).catch(() => []);
          
          // YouTube API 데이터를 채널 형식으로 변환
          channel = {
            id: decodedId,
            channelId: youtubeData.channelId || actualChannelId,
            channelName: youtubeData.channelName || "Unknown Channel",
            handle: youtubeData.handle || null,
            profileImageUrl: youtubeData.profileImageUrl || null,
            subscriberCount: BigInt(youtubeData.subscriberCount || 0),
            totalViewCount: BigInt(youtubeData.totalViewCount || 0),
            videoCount: youtubeData.videoCount || 0,
            country: youtubeData.country || null,
            description: youtubeData.description || null,
            channelCreatedAt: youtubeData.channelCreatedAt || null,
            categoryId: defaultCategory?.id || "",
            weeklySubscriberChange: BigInt(0),
            weeklySubscriberChangeRate: 0,
            weeklyViewCount: BigInt(0),
            weeklyViewCountChange: BigInt(0),
            weeklyViewCountChangeRate: 0,
            averageEngagementRate: 0,
            currentRank: null,
            previousRank: null,
            rankChange: 0,
            createdAt: new Date(),
            lastUpdated: new Date(),
            videos: fallbackVideos.map((v: any) => ({
              id: v.id,
              videoId: v.id,
              title: v.title,
              thumbnailUrl: v.thumbnailUrl,
              publishedAt: v.publishedAt,
              viewCount: BigInt(v.viewCount || 0),
              likeCount: v.likeCount || 0,
              commentCount: v.commentCount || 0,
              engagementRate: v.engagementRate || 0,
            })),
            growthData: [],
            category: defaultCategory || { id: "", name: "기타", nameEn: "Other", description: null, createdAt: new Date(), updatedAt: new Date() },
          } as any;
        }
      }
    }
    
    if (!channel) {
      return null;
    }
    
    // videos를 recentVideos로 교체 (YouTube API에서 가져온 최신 데이터)
    // recentVideos가 있으면 사용, 없으면 DB의 videos 사용
    if (recentVideos.length > 0) {
      channel.videos = recentVideos as any;
    } else if (channel && channel.videos && channel.videos.length > 0) {
      // YouTube API 실패 시 DB의 videos 사용
      console.log(`[getChannel] YouTube API 실패, DB videos 사용: ${channel.videos.length}개`);
      channel.videos = channel.videos;
    } else {
      // videos가 없으면 빈 배열
      channel.videos = [];
    }
    
    // BigInt를 Number로 변환하여 반환
    return {
      ...channel,
      subscriberCount: Number(channel.subscriberCount),
      totalViewCount: Number(channel.totalViewCount),
      weeklyViewCount: Number(channel.weeklyViewCount || 0),
      weeklySubscriberChange: Number(channel.weeklySubscriberChange || 0),
      weeklyViewCountChange: Number(channel.weeklyViewCountChange || 0),
      videos: (channel.videos || []).map((v: any) => ({
        ...v,
        viewCount: typeof v.viewCount === 'bigint' ? Number(v.viewCount) : (v.viewCount || 0),
      })),
      growthData: (channel.growthData || []).map((g: any) => ({
        ...g,
        subscriberCount: typeof g.subscriberCount === 'bigint' ? Number(g.subscriberCount) : g.subscriberCount,
        viewCount: typeof g.viewCount === 'bigint' ? Number(g.viewCount) : g.viewCount,
      })),
    };
  } catch (error: any) {
    console.error(`[getChannel] 오류 발생 - ${id}:`, error.message || error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
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
  } catch (error) {
    return {};
  }
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

