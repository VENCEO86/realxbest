import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelFromYouTubeAPI, fetchChannelVideos } from "@/lib/youtube-api";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS?.split(',')[0] || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/channels/[id]/route.ts:40',message:'YouTube API 호출 시작',data:{channelId:params.id,apiKeyExists:!!YOUTUBE_API_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const youtubeData = await fetchChannelFromYouTubeAPI(params.id, YOUTUBE_API_KEY);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/channels/[id]/route.ts:43',message:'YouTube 채널 데이터 가져오기 결과',data:{hasData:!!youtubeData,channelName:youtubeData?.channelName,handle:youtubeData?.handle,subscriberCount:youtubeData?.subscriberCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (youtubeData) {
        // 최근 동영상 가져오기
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/channels/[id]/route.ts:45',message:'최근 동영상 가져오기 시작',data:{channelId:params.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        const recentVideos = await fetchChannelVideos(params.id, 5, YOUTUBE_API_KEY);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/channels/[id]/route.ts:48',message:'최근 동영상 가져오기 결과',data:{videoCount:recentVideos.length,videoIds:recentVideos.map(v=>v.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // 기본 카테고리
        const defaultCategory = { id: "default", name: "기타", nameEn: "Other" };
        
        // 성장 데이터 생성 (최근 30일, 샘플 데이터)
        const growthData = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          growthData.push({
            date,
            subscriberCount: youtubeData.subscriberCount - (i * 10000), // 샘플 데이터
            viewCount: youtubeData.totalViewCount - (i * 1000000), // 샘플 데이터
          });
        }
        
        // 평균 참여율 계산 (동영상이 있는 경우)
        const avgEngagementRate = recentVideos.length > 0
          ? recentVideos.reduce((sum, v) => sum + v.engagementRate, 0) / recentVideos.length
          : 3.5; // 기본값
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/channels/[id]/route.ts:68',message:'채널 객체 생성 전 데이터 확인',data:{avgEngagementRate,weeklySubscriberChangeRate:1.0,weeklyViewCountChangeRate:5.0,growthDataCount:growthData.length,videosCount:recentVideos.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/channels/[id]/route.ts:142',message:'채널 상세 정보 반환',data:{channelId:formattedChannel.channelId,handle:formattedChannel.handle,hasProfileImage:!!formattedChannel.profileImageUrl,weeklySubscriberChangeRate:formattedChannel.weeklySubscriberChangeRate,weeklyViewCountChangeRate:formattedChannel.weeklyViewCountChangeRate,averageEngagementRate:formattedChannel.averageEngagementRate,videosCount:formattedChannel.videos.length,growthDataCount:formattedChannel.growthData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(formattedChannel);
  } catch (error) {
    console.error("Error fetching channel:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

