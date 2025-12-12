// YouTube 검색 유틸리티

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";

export async function searchChannels(query: string, maxResults: number = 10) {
  try {
    // YouTube Search API로 채널 검색
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // 채널 ID 목록 추출
    const channelIds = data.items.map((item: any) => item.snippet.channelId);

    // 채널 상세 정보 가져오기
    const channelsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(",")}&key=${YOUTUBE_API_KEY}`
    );

    if (!channelsResponse.ok) {
      return data.items.map((item: any) => ({
        channelId: item.snippet.channelId,
        channelName: item.snippet.title,
        handle: item.snippet.customUrl?.replace("@", "") || null,
        profileImageUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        subscriberCount: 0,
        totalViewCount: 0,
        videoCount: 0,
      }));
    }

    const channelsData = await channelsResponse.json();

    return channelsData.items.map((item: any) => ({
      id: item.id,
      channelId: item.id,
      channelName: item.snippet.title,
      handle: item.snippet.customUrl?.replace("@", "") || null,
      profileImageUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(item.statistics.subscriberCount || "0"),
      totalViewCount: parseInt(item.statistics.viewCount || "0"),
      videoCount: parseInt(item.statistics.videoCount || "0"),
      country: item.snippet.country || null,
      description: item.snippet.description || null,
    }));
  } catch (error) {
    console.error("Error searching channels:", error);
    return [];
  }
}


