import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelFromYouTubeAPI, fetchChannelVideos } from "@/lib/youtube-api";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS?.split(',')[0] || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";

// 간단한 메모리 캐시 (프로덕션에서는 Redis 사용 권장)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 캐시 확인
    const cacheKey = `channel:${params.id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // 먼저 데이터베이스에서 조회 시도
    let channel = null;
    try {
      channel = await prisma.youTubeChannel.findFirst({
        where: {
          OR: [
            { id: params.id },
            { channelId: params.id },
          ],
        },
        include: {
          category: true,
          videos: {
            orderBy: { publishedAt: "desc" },
            take: 10,
          },
          growthData: {
            orderBy: { date: "desc" },
            take: 30,
          },
        },
      });
    } catch (dbError) {
      // 데이터베이스 오류 무시하고 YouTube API로 진행
      console.log("Database not available, using YouTube API");
    }

    // 데이터베이스에 없으면 YouTube API에서 가져오기
    if (!channel && params.id.startsWith("UC")) {

      const youtubeData = await fetchChannelFromYouTubeAPI(params.id, YOUTUBE_API_KEY);

      if (youtubeData) {
        // 최근 동영상 가져오기

        const recentVideos = await fetchChannelVideos(params.id, 5, YOUTUBE_API_KEY);

        // 기본 카테고리
        const defaultCategory = { id: "default", name: "기타", nameEn: "Other" };
        
        // 실제 성장 데이터 가져오기 (DB에서)
        let growthData = [];
        try {
          const dbChannel = await prisma.youTubeChannel.findUnique({
            where: { channelId: params.id },
            include: {
              growthData: {
                orderBy: { date: 'asc' },
                take: 30, // 최근 30일
              },
            },
          });
          
          if (dbChannel && dbChannel.growthData.length > 0) {
            // DB에서 실제 데이터 사용
            growthData = dbChannel.growthData.map(g => ({
              date: g.date,
              subscriberCount: Number(g.subscriberCount),
              viewCount: Number(g.viewCount),
            }));
          } else {
            // DB에 데이터가 없으면 현재 값 기준으로 초기 데이터 생성
            const now = new Date();
            growthData = [{
              date: now,
              subscriberCount: youtubeData.subscriberCount,
              viewCount: youtubeData.totalViewCount,
            }];
          }
        } catch (error) {
          console.error("Error fetching growth data:", error);
          // 오류 시 현재 값만 표시
          growthData = [{
            date: new Date(),
            subscriberCount: youtubeData.subscriberCount,
            viewCount: youtubeData.totalViewCount,
          }];
        }
        
        // 평균 참여율 계산 (동영상이 있는 경우)
        const avgEngagementRate = recentVideos.length > 0
          ? recentVideos.reduce((sum, v) => sum + v.engagementRate, 0) / recentVideos.length
          : 3.5; // 기본값

        channel = {
          id: youtubeData.channelId,
          channelId: youtubeData.channelId,
          channelName: youtubeData.channelName,
          handle: youtubeData.handle || null,
          profileImageUrl: youtubeData.profileImageUrl || null,
          category: defaultCategory,
          categoryId: "default",
          subscriberCount: BigInt(youtubeData.subscriberCount),
          totalViewCount: BigInt(youtubeData.totalViewCount),
          videoCount: youtubeData.videoCount,
          description: youtubeData.description || null,
          country: youtubeData.country || null,
          channelCreatedAt: youtubeData.channelCreatedAt || null,
          weeklySubscriberChange: BigInt(Math.floor(youtubeData.subscriberCount * 0.01)), // 1% 증가 가정
          weeklySubscriberChangeRate: 1.0,
          weeklyViewCount: BigInt(Math.floor(youtubeData.totalViewCount * 0.05)), // 5% 증가 가정
          weeklyViewCountChange: BigInt(Math.floor(youtubeData.totalViewCount * 0.05)),
          weeklyViewCountChangeRate: 5.0,
          averageEngagementRate: avgEngagementRate,
          currentRank: null,
          previousRank: null,
          rankChange: 0,
          createdAt: new Date(),
          lastUpdated: new Date(),
          videos: recentVideos.map(v => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            publishedAt: v.publishedAt,
            viewCount: BigInt(v.viewCount),
            likeCount: v.likeCount,
            commentCount: v.commentCount,
            engagementRate: v.engagementRate,
          })),
          growthData: growthData.map(g => ({
            date: g.date,
            subscriberCount: BigInt(g.subscriberCount),
            viewCount: BigInt(g.viewCount),
          })),
        };
      }
    }

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // BigInt를 Number로 변환
    const formattedChannel = {
      ...channel,
      subscriberCount: Number(channel.subscriberCount),
      totalViewCount: Number(channel.totalViewCount),
      weeklyViewCount: Number(channel.weeklyViewCount || 0),
      weeklySubscriberChange: Number(channel.weeklySubscriberChange || 0),
      weeklyViewCountChange: Number(channel.weeklyViewCountChange || 0),
      videos: (channel.videos || []).map((video: any) => ({
        ...video,
        viewCount: Number(video.viewCount),
      })),
      growthData: (channel.growthData || []).map((g: any) => ({
        ...g,
        subscriberCount: Number(g.subscriberCount),
        viewCount: Number(g.viewCount),
      })),
    };

    // 캐시에 저장
    cache.set(cacheKey, { data: formattedChannel, timestamp: Date.now() });
    
    // 캐시 크기 제한 (최대 100개)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    return NextResponse.json(formattedChannel, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

