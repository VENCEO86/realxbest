/**
 * 이탈리아 채널 전용 수집 스크립트
 * 최소 200개 이상 확보 목표
 */

import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "../lib/countries";

const prisma = new PrismaClient();

// API 키 관리
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const QUOTA_LIMIT_PER_KEY = 9000;

function getNextApiKey(): string {
  const key = YOUTUBE_API_KEYS[currentKeyIndex % YOUTUBE_API_KEYS.length];
  currentKeyIndex++;
  return key;
}

// 이탈리아 최소 기준 (완화)
const MIN_SUBSCRIBER_COUNT = 50;
const MIN_VIEW_COUNT = 500;

// 이탈리아 현지어 키워드 (대폭 확대)
const ITALY_KEYWORDS = {
  entertainment: [
    "intrattenimento", "divertimento", "spettacolo", "intrattenimento italiano", 
    "youtuber italiani", "canali italiani", "creatori italiani", "italian youtuber", 
    "italian channel", "youtuber italia", "canali youtube italia", "creatori italia",
    "comici italiani", "show italiani", "intrattenimento youtube italia",
    "top youtuber italiani", "migliori youtuber italiani", "famosi youtuber italiani",
    "italian entertainment", "italian comedy", "italian vlog", "italian lifestyle",
    "italy entertainment", "italy comedy", "italy vlog", "italy lifestyle"
  ],
  music: [
    "musica italiana", "canzoni italiane", "musica", "cantanti italiani", 
    "artisti italiani", "italian music", "italian singer", "cantanti italia",
    "musica pop italiana", "rap italiano", "trap italiano", "rock italiano",
    "top musica italiana", "hit italiane", "canzoni italiane 2024",
    "italian artists", "italian musicians", "italian bands",
    "italy music", "italy singer", "italy artists"
  ],
  gaming: [
    "giochi", "videogiochi", "gaming italiano", "gamer italiani", "streamer italiani",
    "youtuber gaming italiani", "videogiochi italia", "gaming italia",
    "italian gaming", "italian gamers", "italian streamers", "italian esports",
    "italy gaming", "italy gamers", "italy streamers"
  ],
  sports: [
    "sport", "calcio", "sport italiano", "calcio italiano", "serie a",
    "sport italia", "calciatori italiani", "squadre italiane", "sportivi italiani",
    "italian sports", "italian football", "italian soccer", "italian athletes",
    "italy sports", "italy football", "italy soccer"
  ],
  education: [
    "educazione", "istruzione", "scuola", "scuola italiana", "università italiana",
    "lezioni italiane", "corsi italiani", "tutorial italiano", "insegnamento italiano",
    "italian education", "italian learning", "italian courses",
    "italy education", "italy learning", "italy courses"
  ],
  news: [
    "notizie", "giornalismo", "informazione", "notizie italiane", "giornali italiani",
    "telegiornali italiani", "informazione italia", "attualità italiana",
    "italian news", "italian journalism", "italian media",
    "italy news", "italy journalism"
  ],
  people: [
    "vlog", "vlogger italiano", "youtuber italiano", "vlogger italiani",
    "vlog italia", "youtuber italia", "creatori italiani", "influencer italiani",
    "italian vlog", "italian vlogger", "italian influencers", "italian creators",
    "italy vlog", "italy vlogger", "italy influencers"
  ],
  howto: [
    "tutorial", "come fare", "guida", "tutorial italiano", "guide italiane",
    "come fare italiano", "istruzioni italiane", "consigli italiani",
    "italian tutorial", "italian guides", "italian tips", "italian diy",
    "italy tutorial", "italy guides", "italy tips"
  ],
};

// 검색 함수
async function searchChannels(
  query: string,
  maxResults: number = 50,
  order: "viewCount" | "rating" | "relevance" = "viewCount"
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(Math.min(maxResults, 50)),
      order: order,
      regionCode: "IT",
      hl: "it",
      relevanceLanguage: "it",
      key: apiKey,
    });
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error(`  ❌ API 키 할당량 소진: ${apiKey.substring(0, 20)}...`);
        return [];
      }
      return [];
    }
    
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items
      .filter((item: any) => item.id?.channelId)
      .map((item: any) => ({
        channelId: item.id.channelId,
        channelName: item.snippet.title,
      }));
  } catch (error: any) {
    console.error(`  ❌ 검색 오류 (${query}):`, error.message);
    return [];
  }
}

// 채널 상세 정보 가져오기
async function fetchChannelDetails(channelIds: string[]): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  const batchSize = 50;
  const results: any[] = [];
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    
    try {
      const ids = batch.join(",");
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error(`  ❌ API 키 할당량 소진`);
          continue;
        }
        continue;
      }
      
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const stats = item.statistics;
          const snippet = item.snippet;
          
          const subscriberCount = parseInt(stats.subscriberCount || "0");
          const viewCount = parseInt(stats.viewCount || "0");
          
          const profileImageUrl = snippet.thumbnails?.high?.url 
            || snippet.thumbnails?.medium?.url 
            || snippet.thumbnails?.default?.url 
            || null;
          
          // 최소 기준 체크 (완화된 기준)
          if (subscriberCount >= MIN_SUBSCRIBER_COUNT && viewCount >= MIN_VIEW_COUNT && profileImageUrl) {
            results.push({
              channelId: item.id,
              channelName: snippet.title,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: profileImageUrl,
              subscriberCount,
              totalViewCount: viewCount,
              videoCount: parseInt(stats.videoCount || "0"),
              country: snippet.country || "IT",
              description: snippet.description || null,
              channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
            });
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ 배치 오류:`, error.message);
    }
  }
  
  return results;
}

// 카테고리 가져오기 또는 생성
async function getOrCreateCategory(name: string, nameEn: string): Promise<string> {
  let category = await prisma.category.findUnique({
    where: { name },
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { name, nameEn },
    });
  }
  
  return category.id;
}

// 채널 저장
async function saveChannel(channelData: any, categoryId: string): Promise<boolean> {
  try {
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      await prisma.youTubeChannel.update({
        where: { channelId: channelData.channelId },
        data: {
          channelName: channelData.channelName,
          subscriberCount: BigInt(channelData.subscriberCount),
          totalViewCount: BigInt(channelData.totalViewCount),
          videoCount: channelData.videoCount,
          profileImageUrl: channelData.profileImageUrl,
          handle: channelData.handle,
          description: channelData.description,
          country: "IT",
          lastUpdated: new Date(),
        },
      });
      return false;
    }
    
    await prisma.youTubeChannel.create({
      data: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        categoryId,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        description: channelData.description,
        country: "IT",
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ 저장 오류 (${channelData.channelId}):`, error.message);
    return false;
  }
}

// 카테고리별 수집
async function collectForCategory(categoryId: string, categoryName: string, keywords: string[]) {
  console.log(`\n📂 ${categoryName} 카테고리 수집 시작...`);
  
  const allChannelIds = new Set<string>();
  const orders: Array<"viewCount" | "rating" | "relevance"> = ["viewCount", "rating", "relevance"];
  
  // 각 키워드로 검색
  for (const keyword of keywords) {
    for (const order of orders) {
      if (allChannelIds.size >= 1000) break; // 최대 1000개까지 수집
      
      const channels = await searchChannels(keyword, 50, order);
      for (const ch of channels) {
        if (ch.channelId) {
          allChannelIds.add(ch.channelId);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    if (allChannelIds.size >= 1000) break;
  }
  
  console.log(`  📊 ${allChannelIds.size}개 채널 ID 수집 완료`);
  
  if (allChannelIds.size === 0) {
    return { collected: 0, saved: 0 };
  }
  
  // 상세 정보 가져오기
  const channelIdsArray = Array.from(allChannelIds);
  const channelDetails = await fetchChannelDetails(channelIdsArray);
  
  console.log(`  📊 ${channelDetails.length}개 채널 상세 정보 수집 완료`);
  
  // 저장
  let savedCount = 0;
  for (const channel of channelDetails) {
    const saved = await saveChannel(channel, categoryId);
    if (saved) savedCount++;
  }
  
  console.log(`  💾 ${savedCount}개 새 채널 저장 완료`);
  
  return { collected: channelDetails.length, saved: savedCount };
}

// 메인 실행
async function main() {
  console.log("🚀 이탈리아 채널 전용 수집 시작...\n");
  console.log(`📊 목표: 최소 200개 이상 채널 확보\n`);
  
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ YouTube API 키가 설정되지 않았습니다.");
    process.exit(1);
  }
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL이 설정되지 않았습니다.");
    process.exit(1);
  }
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const categories = [
      { id: "entertainment", name: "엔터테인먼트", nameEn: "Entertainment" },
      { id: "music", name: "음악", nameEn: "Music" },
      { id: "gaming", name: "게임", nameEn: "Gaming" },
      { id: "sports", name: "스포츠", nameEn: "Sports" },
      { id: "education", name: "교육", nameEn: "Education" },
      { id: "news", name: "뉴스/정치", nameEn: "News/Politics" },
      { id: "people", name: "인물/블로그", nameEn: "People/Blog" },
      { id: "howto", name: "노하우/스타일", nameEn: "Howto/Style" },
    ];
    
    let totalCollected = 0;
    let totalSaved = 0;
    
    for (const category of categories) {
      const categoryId = await getOrCreateCategory(category.name, category.nameEn);
      const keywords = ITALY_KEYWORDS[category.id as keyof typeof ITALY_KEYWORDS] || [];
      
      const result = await collectForCategory(categoryId, category.name, keywords);
      totalCollected += result.collected;
      totalSaved += result.saved;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 최종 확인
    const finalCount = await prisma.youTubeChannel.count({
      where: { country: "IT" },
    });
    
    console.log(`\n\n✅ 수집 완료!`);
    console.log(`📊 총 수집: ${totalCollected}개`);
    console.log(`💾 총 저장: ${totalSaved}개`);
    console.log(`📈 최종 이탈리아 채널 수: ${finalCount}개\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);


