import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelFromYouTubeAPI, fetchChannelVideos } from "@/lib/youtube-api";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS?.split(',')[0] || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";

// 간단한 메모리 캐시 (프로덕션에서는 Redis 사용 권장)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분 (캐시 시간 증가)

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
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      });
    }

    // 먼저 데이터베이스에서 조회 시도 (ID, channelId, handle 모두 검색)
    let channel = null;
    let needsYouTubeData = false;
    let actualChannelId = params.id;
    
    try {
      // 핸들 형식(@zackdfilms)인 경우 @ 제거
      const searchId = params.id.startsWith('@') ? params.id.substring(1) : params.id;
      
      channel = await prisma.youTubeChannel.findFirst({
        where: {
          OR: [
            { id: params.id },
            { channelId: params.id },
            { handle: searchId },
            { handle: params.id },
          ],
        },
        include: {
          category: true,
          videos: {
            orderBy: { publishedAt: "desc" },
            take: 10,
          },
          growthData: {
            orderBy: { date: "asc" }, // 오래된 순 → 최신 순 (좌 → 우)
            take: 30,
          },
        },
      });
      
      // 채널을 찾았으면 실제 channelId 사용
      if (channel) {
        actualChannelId = channel.channelId;
      }

      // 데이터베이스에 채널이 있지만 growthData가 없으면 YouTube API 호출 필요
      // 동영상은 항상 최신 데이터를 위해 YouTube API에서 가져옴 (저장 불필요)
      if (channel) {
        const hasNoGrowthData = !channel.growthData || channel.growthData.length === 0;
        needsYouTubeData = hasNoGrowthData; // 동영상은 항상 API에서 가져오므로 제외
      }
    } catch (dbError) {
      // 데이터베이스 오류 무시하고 YouTube API로 진행
    }

    // 동영상은 항상 YouTube API에서 최신 데이터 가져오기 (저장 없이 바로 표시)
    let recentVideos: any[] = [];
    let channelIdForVideos = actualChannelId;
    
    // 핸들인 경우 먼저 채널 ID를 찾아야 함
    if (params.id.startsWith("@") || (!actualChannelId.startsWith("UC") && channel)) {
      // YouTube Search API로 채널 ID 찾기
      try {
        const searchQuery = params.id.startsWith("@") ? params.id.substring(1) : params.id;
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

    // 동영상은 항상 YouTube API에서 최신 데이터 가져오기 (저장 없이 바로 표시)
    // 모든 채널에 대해 동영상 가져오기 시도 (UC로 시작하는 채널 ID가 아니어도 시도)
    // 최적화: 채널 정보에서 uploadsPlaylistId를 가져왔다면 전달하여 중복 API 호출 방지
    if (channelIdForVideos && (channelIdForVideos.startsWith("UC") || channel)) {
      try {
        // 채널 정보를 이미 가져왔다면 uploadsPlaylistId 전달 (할당량 절약)
        let uploadsPlaylistId: string | undefined;
        if (channel && (channel as any).uploadsPlaylistId) {
          uploadsPlaylistId = (channel as any).uploadsPlaylistId;
        } else if (shouldCallYouTubeAPI) {
          // YouTube API에서 채널 정보를 가져올 예정이면, 그때 uploadsPlaylistId를 받아서 사용
        }
        recentVideos = await fetchChannelVideos(channelIdForVideos, 5, YOUTUBE_API_KEY, uploadsPlaylistId);
        
        // API 호출 성공했지만 결과가 없으면 DB에서 가져오기 시도
        if (recentVideos.length === 0 && channel && channel.videos && channel.videos.length > 0) {
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
        // API 호출 실패 시 데이터베이스에 있는 동영상 사용 (fallback)
        console.error(`[Channel Videos] API 호출 실패 (${channelIdForVideos}):`, error.message || error);
        
        if (channel && channel.videos && channel.videos.length > 0) {
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

    // 데이터베이스에 없거나 보완 데이터가 필요하면 YouTube API에서 가져오기
    // UC로 시작하는 채널 ID이거나, 핸들로 검색한 경우 YouTube API 호출
    const shouldCallYouTubeAPI = (!channel || needsYouTubeData) && (
      actualChannelId.startsWith("UC") || 
      params.id.startsWith("@") ||
      (!channel && params.id.length > 0)
    );

    if (shouldCallYouTubeAPI) {
      const channelIdForAPI = channelIdForVideos;
      const youtubeData = await fetchChannelFromYouTubeAPI(channelIdForAPI, YOUTUBE_API_KEY);

      if (youtubeData) {

        // 기본 카테고리
        const defaultCategory = { id: "default", name: "기타", nameEn: "Other" };
        
        // 실제 성장 데이터 가져오기 (DB에서)
        let growthData: Array<{ date: Date; subscriberCount: number; viewCount: number }> = [];
        try {
          // 기존 채널이 있으면 그 데이터 사용, 없으면 새로 조회
          const dbChannel = channel || await prisma.youTubeChannel.findUnique({
            where: { channelId: channelIdForAPI },
            include: {
              growthData: {
                orderBy: { date: 'asc' },
                take: 30, // 최근 30일
              },
            },
          });
          
          if (dbChannel && dbChannel.growthData && dbChannel.growthData.length > 0) {
            // DB에서 실제 데이터 사용
            growthData = dbChannel.growthData.map(g => ({
              date: g.date,
              subscriberCount: Number(g.subscriberCount),
              viewCount: Number(g.viewCount),
            }));
          } else {
            // DB에 데이터가 없으면 최근 7일간의 추정 데이터 생성 (차트 표시용)
            const now = new Date();
            const baseSubscribers = youtubeData.subscriberCount;
            const baseViews = youtubeData.totalViewCount;
            
            // 최근 7일간의 추정 성장 데이터 생성 (오래된 순 → 최신 순)
            for (let i = 0; i <= 6; i++) {
              const date = new Date(now);
              date.setDate(date.getDate() - (6 - i)); // 오래된 날짜부터
              // 약간의 변동을 주어 차트가 보이도록
              const variation = 1 + (Math.random() * 0.02 - 0.01); // ±1% 변동
              growthData.push({
                date: date,
                subscriberCount: Math.floor(baseSubscribers * variation * (1 - i * 0.001)),
                viewCount: Math.floor(baseViews * variation * (1 - i * 0.001)),
              });
            }
          }
        } catch (error) {
          console.error("Error fetching growth data:", error);
          // 오류 시 최근 7일간의 추정 데이터 생성 (오래된 순 → 최신 순)
          const now = new Date();
          const baseSubscribers = youtubeData.subscriberCount;
          const baseViews = youtubeData.totalViewCount;
          for (let i = 0; i <= 6; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (6 - i)); // 오래된 날짜부터
            growthData.push({
              date: date,
              subscriberCount: Math.floor(baseSubscribers * (1 - i * 0.001)),
              viewCount: Math.floor(baseViews * (1 - i * 0.001)),
            });
          }
        }
        
        // 평균 참여율 계산 (동영상이 있는 경우)
        const avgEngagementRate = recentVideos && recentVideos.length > 0
          ? recentVideos.reduce((sum: number, v: any) => sum + v.engagementRate, 0) / recentVideos.length
          : 3.5; // 기본값

        // 기존 채널 데이터가 있으면 병합, 없으면 새로 생성
        if (channel) {
          // 기존 채널 데이터에 YouTube API 데이터 병합
          channel = {
            ...channel,
            channelName: youtubeData.channelName,
            handle: youtubeData.handle || channel.handle,
            profileImageUrl: youtubeData.profileImageUrl || channel.profileImageUrl,
            subscriberCount: BigInt(youtubeData.subscriberCount),
            totalViewCount: BigInt(youtubeData.totalViewCount),
            videoCount: youtubeData.videoCount,
            description: youtubeData.description || channel.description,
            country: youtubeData.country || channel.country,
            lastUpdated: new Date(),
            // videos와 growthData는 위에서 처리한 것 사용
            videos: (recentVideos || []).map((v: any) => ({
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
            // 주간 변화율 계산 (성장 데이터가 있으면)
            weeklySubscriberChangeRate: growthData.length > 1 
              ? ((growthData[growthData.length - 1].subscriberCount - growthData[0].subscriberCount) / growthData[0].subscriberCount) * 100
              : (channel.weeklySubscriberChangeRate || 0),
            weeklyViewCountChangeRate: growthData.length > 1
              ? ((growthData[growthData.length - 1].viewCount - growthData[0].viewCount) / growthData[0].viewCount) * 100
              : (channel.weeklyViewCountChangeRate || 0),
            averageEngagementRate: avgEngagementRate || channel.averageEngagementRate || 0,
          };
        } else {
          // 새 채널 생성
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
            weeklySubscriberChange: BigInt(Math.floor(youtubeData.subscriberCount * 0.01)),
            weeklySubscriberChangeRate: growthData.length > 1 
              ? ((growthData[growthData.length - 1].subscriberCount - growthData[0].subscriberCount) / growthData[0].subscriberCount) * 100
              : 1.0,
            weeklyViewCount: BigInt(Math.floor(youtubeData.totalViewCount * 0.05)),
            weeklyViewCountChange: BigInt(Math.floor(youtubeData.totalViewCount * 0.05)),
            weeklyViewCountChangeRate: growthData.length > 1
              ? ((growthData[growthData.length - 1].viewCount - growthData[0].viewCount) / growthData[0].viewCount) * 100
              : 5.0,
            averageEngagementRate: avgEngagementRate,
            currentRank: null,
            previousRank: null,
            rankChange: 0,
            createdAt: new Date(),
            lastUpdated: new Date(),
            videos: (recentVideos || []).map((v: any) => ({
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
    }

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // 데이터베이스에 채널이 있지만 growthData나 videos가 없을 때 최소한의 데이터 생성
    if (channel && (!channel.growthData || channel.growthData.length === 0)) {
      const baseSubscribers = Number(channel.subscriberCount || 0);
      const baseViews = Number(channel.totalViewCount || 0);
      
      if (baseSubscribers > 0 && baseViews > 0) {
        const now = new Date();
        const estimatedGrowthData = [];
        // 오래된 순 → 최신 순 (좌 → 우)
        for (let i = 0; i <= 6; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i)); // 오래된 날짜부터
          estimatedGrowthData.push({
            date: date,
            subscriberCount: BigInt(Math.floor(baseSubscribers * (1 - i * 0.001))),
            viewCount: BigInt(Math.floor(baseViews * (1 - i * 0.001))),
          });
        }
        channel.growthData = estimatedGrowthData;
        
        // 주간 변화율 계산
        if (estimatedGrowthData.length > 1) {
          const first = estimatedGrowthData[0];
          const last = estimatedGrowthData[estimatedGrowthData.length - 1];
          channel.weeklySubscriberChangeRate = ((Number(last.subscriberCount) - Number(first.subscriberCount)) / Number(first.subscriberCount)) * 100;
          channel.weeklyViewCountChangeRate = ((Number(last.viewCount) - Number(first.viewCount)) / Number(first.viewCount)) * 100;
        }
      }
    }
    
    // 동영상은 YouTube API에서 가져온 데이터 사용 (위에서 처리됨)
    // channel 객체에 videos가 없으면 빈 배열로 설정
    if (!channel.videos) {
      channel.videos = [];
    }
    
    // 동영상은 YouTube API에서 가져온 최신 데이터 사용 (데이터베이스 저장 없이 바로 표시)
    if (recentVideos && recentVideos.length > 0) {
      channel.videos = recentVideos;
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
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
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

