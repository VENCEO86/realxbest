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
  uploadsPlaylistId?: string; // 동영상 가져오기 최적화를 위해 추가
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
    const contentDetails = channel.contentDetails;

    const handle = snippet.customUrl?.replace("@", "") || null;
    const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads || undefined;

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
      uploadsPlaylistId: uploadsPlaylistId, // 동영상 가져오기 최적화
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
 * @param channelId 채널 ID
 * @param maxResults 최대 결과 수
 * @param apiKey YouTube API 키
 * @param uploadsPlaylistId (선택) uploads playlist ID - 제공되면 channels.list 호출 생략하여 할당량 절약
 */
export async function fetchChannelVideos(
  channelId: string,
  maxResults: number = 5,
  apiKey?: string,
  uploadsPlaylistId?: string
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
    console.warn("[fetchChannelVideos] YouTube API key가 설정되지 않았습니다.");
    return [];
  }

  if (!channelId || !channelId.startsWith("UC")) {
    console.warn(`[fetchChannelVideos] 유효하지 않은 채널 ID: ${channelId}`);
    return [];
  }

  try {
    // uploadsPlaylistId가 제공되지 않으면 채널 정보에서 가져오기 (기존 방식)
    let playlistId = uploadsPlaylistId;
    
    if (!playlistId) {
      // 1. 채널의 uploads playlist ID 가져오기 (할당량 1 unit 소모)
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
      );

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json().catch(() => ({}));
        console.error(`[fetchChannelVideos] 채널 정보 조회 실패 (${channelId}):`, channelResponse.status, errorData);
        return [];
      }

      const channelData = await channelResponse.json();
      playlistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!playlistId) {
        console.warn(`[fetchChannelVideos] 업로드 플레이리스트 ID를 찾을 수 없음 (${channelId})`);
        return [];
      }
    }

    // 2. Playlist에서 최근 동영상 가져오기
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`
    );

    if (!playlistResponse.ok) {
      const errorData = await playlistResponse.json().catch(() => ({}));
      console.error(`[fetchChannelVideos] 플레이리스트 조회 실패 (${playlistId}):`, playlistResponse.status, errorData);
      return [];
    }

    const playlistData = await playlistResponse.json();
    const videoIds = playlistData.items?.map((item: any) => item.snippet.resourceId.videoId) || [];

    if (videoIds.length === 0) {
      return [];
    }

    // 3. 동영상 상세 정보 가져오기
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey}`
    );

    if (!videosResponse.ok) {
      const errorData = await videosResponse.json().catch(() => ({}));
      console.error(`[fetchChannelVideos] 동영상 상세 정보 조회 실패:`, videosResponse.status, errorData);
      return [];
    }

    const videosData = await videosResponse.json();

    if (!videosData.items || videosData.items.length === 0) {
      console.warn(`[fetchChannelVideos] 동영상이 없음 (${channelId})`);
      return [];
    }

    return videosData.items.map((video: any) => {
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

