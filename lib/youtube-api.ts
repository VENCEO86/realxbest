// YouTube Data API 연동 유틸리티
// 실제 데이터 수집을 위한 헬퍼 함수들

interface YouTubeChannelData {
  channelId: string;
  channelName: string;
  handle?: string;
  profileImageUrl?: string;
  subscriberCount: number;
  totalViewCount: number;
  videoCount: number;
  country?: string;
  description?: string;
  channelCreatedAt?: Date;
}

/**
 * YouTube Data API를 통해 채널 정보를 가져옵니다.
 * 실제 구현 시 YouTube Data API v3를 사용합니다.
 */
export async function fetchChannelFromYouTubeAPI(
  channelId: string,
  apiKey?: string
): Promise<YouTubeChannelData | null> {
  if (!apiKey) {
    console.warn("YouTube API key가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;

    const handle = snippet.customUrl?.replace("@", "") || null;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:52',message:'채널 데이터 파싱',data:{channelId:channel.id,channelName:snippet.title,handle,customUrl:snippet.customUrl,hasThumbnail:!!snippet.thumbnails?.high?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return {
      channelId: channel.id,
      channelName: snippet.title,
      handle: handle,
      profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(statistics.subscriberCount || "0"),
      totalViewCount: parseInt(statistics.viewCount || "0"),
      videoCount: parseInt(statistics.videoCount || "0"),
      country: snippet.country || null, // 국가 코드 (예: "US", "KR", "JP")
      description: snippet.description || null,
      channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : undefined,
    };
  } catch (error) {
    console.error("Error fetching channel from YouTube API:", error);
    return null;
  }
}

/**
 * 여러 채널을 배치로 가져옵니다.
 */
export async function fetchChannelsBatch(
  channelIds: string[],
  apiKey?: string
): Promise<YouTubeChannelData[]> {
  if (!apiKey || channelIds.length === 0) {
    return [];
  }

  // YouTube API는 한 번에 최대 50개까지 조회 가능
  const batchSize = 50;
  const results: YouTubeChannelData[] = [];

  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    const ids = batch.join(",");

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`
      );

      if (!response.ok) {
        console.error(`YouTube API error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.items) {
        for (const channel of data.items) {
          const snippet = channel.snippet;
          const statistics = channel.statistics;

          results.push({
            channelId: channel.id,
            channelName: snippet.title,
            handle: snippet.customUrl?.replace("@", "") || undefined,
            profileImageUrl: snippet.thumbnails?.high?.url,
            subscriberCount: parseInt(statistics.subscriberCount || "0"),
            totalViewCount: parseInt(statistics.viewCount || "0"),
            videoCount: parseInt(statistics.videoCount || "0"),
            country: snippet.country,
            description: snippet.description,
            channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : undefined,
          });
        }
      }

      // Rate limiting 방지를 위한 딜레이
      if (i + batchSize < channelIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error fetching channels batch:", error);
    }
  }

  return results;
}

/**
 * 검색을 통해 채널을 찾습니다.
 */
export async function searchChannels(
  query: string,
  maxResults: number = 10,
  apiKey?: string
): Promise<YouTubeChannelData[]> {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const channelIds = data.items?.map((item: any) => item.snippet.channelId) || [];

    if (channelIds.length === 0) {
      return [];
    }

    return fetchChannelsBatch(channelIds, apiKey);
  } catch (error) {
    console.error("Error searching channels:", error);
    return [];
  }
}

/**
 * 채널의 최근 동영상을 가져옵니다.
 */
export async function fetchChannelVideos(
  channelId: string,
  maxResults: number = 5,
  apiKey?: string
): Promise<Array<{
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
}>> {
  if (!apiKey) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:182',message:'API 키 없음',data:{channelId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return [];
  }

  try {
    // 1. 채널의 uploads playlist ID 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:192',message:'채널 contentDetails 응답',data:{status:channelResponse.status,ok:channelResponse.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!channelResponse.ok) {
      return [];
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:199',message:'uploads playlist ID 확인',data:{hasPlaylistId:!!uploadsPlaylistId,playlistId:uploadsPlaylistId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!uploadsPlaylistId) {
      return [];
    }

    // 2. Playlist에서 최근 동영상 가져오기
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
    );

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:208',message:'playlist items 응답',data:{status:playlistResponse.status,ok:playlistResponse.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!playlistResponse.ok) {
      return [];
    }

    const playlistData = await playlistResponse.json();
    const videoIds = playlistData.items?.map((item: any) => item.snippet.resourceId.videoId) || [];

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:216',message:'동영상 ID 추출',data:{videoIdsCount:videoIds.length,videoIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (videoIds.length === 0) {
      return [];
    }

    // 3. 동영상 상세 정보 가져오기
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey}`
    );

    if (!videosResponse.ok) {
      return [];
    }

    const videosData = await videosResponse.json();

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/youtube-api.ts:230',message:'동영상 상세 정보 가져오기 완료',data:{itemsCount:videosData.items?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return videosData.items?.map((video: any) => {
      const snippet = video.snippet;
      const statistics = video.statistics;
      const viewCount = parseInt(statistics.viewCount || "0");
      const likeCount = parseInt(statistics.likeCount || "0");
      const commentCount = parseInt(statistics.commentCount || "0");
      const engagementRate = viewCount > 0 
        ? ((likeCount + commentCount) / viewCount) * 100 
        : 0;

      return {
        id: video.id,
        title: snippet.title,
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
        publishedAt: new Date(snippet.publishedAt),
        viewCount,
        likeCount,
        commentCount,
        engagementRate,
      };
    }) || [];
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    return [];
  }
}

