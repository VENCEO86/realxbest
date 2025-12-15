/**
 * NoxInfluencer 방식 벤치마킹 데이터 수집 스크립트
 * - 인기 채널 우선 수집
 * - 트렌딩 검색어 활용
 * - 다양한 검색 쿼리 조합
 * - 국가별 TOP 100 채널 수집
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
const keyUsageCount = new Map<string, number>();
const exhaustedKeys = new Set<string>();
const dailyQuotaUsed = new Map<string, number>();
const QUOTA_LIMIT_PER_KEY = 9000;

// 목표 설정 (NoxInfluencer 수준)
const TARGET_CHANNELS_PER_COUNTRY_CATEGORY = 200; // 최소 200개
const MIN_SUBSCRIBER_COUNT = 1000;
const MIN_VIEW_COUNT = 10000;

// 국가별 최소 기준
const COUNTRY_MIN_STANDARDS: Record<string, { subscribers: number; views: number }> = {
  IT: { subscribers: 500, views: 5000 },
  TH: { subscribers: 500, views: 5000 },
  VN: { subscribers: 500, views: 5000 },
  PH: { subscribers: 500, views: 5000 },
  ID: { subscribers: 500, views: 5000 },
  ES: { subscribers: 500, views: 5000 },
  FR: { subscribers: 500, views: 5000 },
  DE: { subscribers: 500, views: 5000 },
  JP: { subscribers: 500, views: 5000 },
  CN: { subscribers: 500, views: 5000 },
  DEFAULT: { subscribers: 1000, views: 10000 },
};

// 국가별 언어 코드
const COUNTRY_LANGUAGE_CODES: Record<string, string> = {
  IT: "it", TH: "th", VN: "vi", PH: "en", ID: "id", ES: "es", FR: "fr", DE: "de",
  JP: "ja", CN: "zh", KR: "ko", BR: "pt", PT: "pt", RU: "ru", TR: "tr", PL: "pl",
  NL: "nl", GR: "el", CZ: "cs", RO: "ro", HU: "hu", UA: "uk", AR: "es", CL: "es",
  CO: "es", PE: "es", EC: "es", MX: "es", SA: "ar", AE: "ar", EG: "ar", IL: "he",
  IN: "hi", MY: "ms", SG: "en", TW: "zh-TW", HK: "zh-HK", AU: "en", NZ: "en",
  CA: "en", GB: "en", US: "en",
};

// 카테고리 목록
const CATEGORIES = [
  { id: "entertainment", name: "엔터테인먼트", nameEn: "Entertainment", keywords: ["entertainment", "funny", "comedy", "vlog", "show"] },
  { id: "music", name: "음악", nameEn: "Music", keywords: ["music", "song", "artist", "musician", "singer"] },
  { id: "education", name: "교육", nameEn: "Education", keywords: ["education", "tutorial", "learn", "study", "course"] },
  { id: "gaming", name: "게임", nameEn: "Gaming", keywords: ["gaming", "game", "playthrough", "stream", "esports"] },
  { id: "sports", name: "스포츠", nameEn: "Sports", keywords: ["sports", "football", "basketball", "fitness", "soccer"] },
  { id: "news", name: "뉴스/정치", nameEn: "News/Politics", keywords: ["news", "politics", "current events", "breaking"] },
  { id: "people", name: "인물/블로그", nameEn: "People/Blog", keywords: ["vlog", "lifestyle", "daily", "blog", "personal"] },
  { id: "howto", name: "노하우/스타일", nameEn: "Howto/Style", keywords: ["howto", "tutorial", "tips", "style", "diy"] },
  { id: "other", name: "기타", nameEn: "Other", keywords: ["popular", "trending", "top", "best"] },
];

// NoxInfluencer 스타일 검색 쿼리 생성기
function generateNoxInfluencerQueries(countryName: string, category: typeof CATEGORIES[0], languageCode: string): string[] {
  const queries: string[] = [];
  
  // 1. 기본 인기 채널 검색 (NoxInfluencer 스타일)
  queries.push(`top ${countryName} ${category.nameEn} youtubers`);
  queries.push(`best ${countryName} ${category.nameEn} channels`);
  queries.push(`popular ${countryName} ${category.nameEn} creators`);
  queries.push(`famous ${countryName} ${category.nameEn} youtubers`);
  
  // 2. 구독자 수 기준 검색
  queries.push(`most subscribed ${countryName} ${category.nameEn} channels`);
  queries.push(`highest subscribers ${countryName} ${category.nameEn}`);
  
  // 3. 조회수 기준 검색
  queries.push(`most viewed ${countryName} ${category.nameEn} channels`);
  queries.push(`highest views ${countryName} ${category.nameEn}`);
  
  // 4. 트렌딩 검색
  queries.push(`trending ${countryName} ${category.nameEn}`);
  queries.push(`viral ${countryName} ${category.nameEn} channels`);
  
  // 5. 카테고리별 특화 검색
  for (const keyword of category.keywords.slice(0, 3)) {
    queries.push(`${countryName} ${keyword} channel`);
    queries.push(`${keyword} ${countryName} youtuber`);
    queries.push(`top ${countryName} ${keyword}`);
  }
  
  // 6. 현지어 검색 (언어 코드 기반)
  if (languageCode !== "en") {
    // 현지어로 "인기", "최고", "유명" 같은 키워드 추가
    queries.push(`${countryName} ${category.nameEn} popular`);
    queries.push(`${countryName} ${category.nameEn} famous`);
  }
  
  return queries;
}

// API 키 관리
function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => {
    if (exhaustedKeys.has(key)) return false;
    const used = dailyQuotaUsed.get(key) || 0;
    return used < QUOTA_LIMIT_PER_KEY;
  });
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 할당량이 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  return key;
}

function incrementApiUsage(key: string, units: number = 1) {
  const current = dailyQuotaUsed.get(key) || 0;
  dailyQuotaUsed.set(key, current + units);
  
  if (current + units >= QUOTA_LIMIT_PER_KEY) {
    exhaustedKeys.add(key);
  }
}

/**
 * NoxInfluencer 방식 채널 검색
 * - order 파라미터 활용 (viewCount, rating, relevance 등)
 * - 다양한 정렬 기준으로 검색
 */
async function searchChannelsNoxStyle(
  query: string,
  countryCode: string,
  languageCode: string,
  order: "viewCount" | "rating" | "relevance" | "date" = "viewCount",
  maxResults: number = 50
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  incrementApiUsage(apiKey, 100);
  
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(Math.min(maxResults, 50)),
      order: order, // NoxInfluencer처럼 정렬 기준 활용
      key: apiKey,
    });
    
    if (countryCode) {
      params.append("regionCode", countryCode);
    }
    
    if (languageCode) {
      params.append("hl", languageCode);
    }
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY);
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
    return [];
  }
}

/**
 * 채널 상세 정보 가져오기 (배치 처리)
 */
async function fetchChannelDetails(channelIds: string[], targetCountryCode?: string): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  const batchSize = 50;
  const results: any[] = [];
  const minStandards = COUNTRY_MIN_STANDARDS[targetCountryCode || 'DEFAULT'] || COUNTRY_MIN_STANDARDS.DEFAULT;
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    incrementApiUsage(apiKey, 1);
    
    try {
      const ids = batch.join(",");
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY);
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
          
          if (subscriberCount >= minStandards.subscribers && viewCount >= minStandards.views) {
            const channelCountry = snippet.country || null;
            if (targetCountryCode && channelCountry && channelCountry !== targetCountryCode) {
              continue;
            }
            
            results.push({
              channelId: item.id,
              channelName: snippet.title,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
              subscriberCount,
              totalViewCount: viewCount,
              videoCount: parseInt(stats.videoCount || "0"),
              country: channelCountry || targetCountryCode || null,
              description: snippet.description || null,
              channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
            });
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      // 에러 무시하고 계속 진행
    }
  }
  return results;
}

/**
 * 카테고리 가져오기 또는 생성
 */
async function getOrCreateCategory(name: string, nameEn: string): Promise<string> {
  const existing = await prisma.category.findUnique({
    where: { name },
  });
  
  if (existing) return existing.id;
  
  const created = await prisma.category.create({
    data: { name, nameEn },
  });
  
  return created.id;
}

/**
 * 현재 채널 개수 확인
 */
async function getChannelCount(countryCode: string, categoryId: string): Promise<number> {
  return await prisma.youTubeChannel.count({
    where: {
      country: countryCode,
      categoryId: categoryId,
    },
  });
}

/**
 * 채널 저장
 */
async function saveChannel(
  channelData: any,
  categoryId: string,
  countryCode: string
): Promise<boolean> {
  try {
    const actualCountryCode = channelData.country || countryCode;
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
          lastUpdated: new Date(),
          country: actualCountryCode,
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
        country: actualCountryCode,
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    return true;
  } catch (error: any) {
    return false;
  }
}

/**
 * NoxInfluencer 방식 국가별/카테고리별 채널 수집
 */
async function collectChannelsNoxStyle(
  countryCode: string,
  countryName: string,
  category: typeof CATEGORIES[0]
): Promise<{ collected: number; saved: number }> {
  const categoryId = await getOrCreateCategory(category.name, category.nameEn);
  const currentCount = await getChannelCount(countryCode, categoryId);
  
  if (currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY) {
    // 목표 달성해도 기존 채널 업데이트는 계속
  }
  
  const needToCollect = Math.max(
    TARGET_CHANNELS_PER_COUNTRY_CATEGORY - currentCount,
    0
  );
  
  if (needToCollect === 0 && currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY) {
    // 최소 목표 달성했고 추가 수집 불필요하면 기존 채널만 업데이트
    return { collected: 0, saved: 0 };
  }
  
  const allChannelIds = new Set<string>();
  const languageCode = COUNTRY_LANGUAGE_CODES[countryCode] || "en";
  
  // 기존 채널 ID 로드
  const existingChannels = await prisma.youTubeChannel.findMany({
    where: {
      country: countryCode,
      categoryId: categoryId,
    },
    select: { channelId: true },
  });
  existingChannels.forEach(ch => allChannelIds.add(ch.channelId));
  
  // NoxInfluencer 스타일 검색 쿼리 생성
  const queries = generateNoxInfluencerQueries(countryName, category, languageCode);
  
  // 다양한 정렬 기준으로 검색 (NoxInfluencer 방식)
  const orders: Array<"viewCount" | "rating" | "relevance" | "date"> = [
    "viewCount",  // 조회수 기준 (인기 채널 우선)
    "rating",     // 평점 기준
    "relevance",  // 관련성 기준
  ];
  
  for (const order of orders) {
    for (const query of queries.slice(0, 10)) { // 상위 10개 쿼리만 사용
      if (allChannelIds.size >= needToCollect * 1.5) break;
      
      const channels = await searchChannelsNoxStyle(
        query,
        countryCode,
        languageCode,
        order,
        50
      );
      
      for (const ch of channels) {
        if (ch.channelId) {
          allChannelIds.add(ch.channelId);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (allChannelIds.size >= needToCollect * 1.5) break;
  }
  
  if (allChannelIds.size === 0) {
    return { collected: 0, saved: 0 };
  }
  
  const channelIdsArray = Array.from(allChannelIds);
  const channelDetails = await fetchChannelDetails(channelIdsArray, countryCode);
  
  let savedCount = 0;
  const savePromises: Promise<boolean>[] = [];
  
  for (const channel of channelDetails) {
    savePromises.push(saveChannel(channel, categoryId, countryCode));
  }
  
  const saveResults = await Promise.all(savePromises);
  savedCount = saveResults.filter(r => r === true).length;
  
  return { collected: channelDetails.length, saved: savedCount };
}

/**
 * 메인 함수
 */
async function main() {
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
    
    const countries = COUNTRIES.filter(c => c.value !== "all");
    let totalCollected = 0;
    let totalSaved = 0;
    let processed = 0;
    const total = countries.length * CATEGORIES.length;
    
    for (const country of countries) {
      for (const category of CATEGORIES) {
        processed++;
        
        try {
          const result = await collectChannelsNoxStyle(
            country.value,
            country.label,
            category
          );
          
          totalCollected += result.collected;
          totalSaved += result.saved;
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          console.error(`  ❌ 오류: ${category.name}`, error.message);
        }
        
        const availableKeys = YOUTUBE_API_KEYS.filter(key => {
          const used = dailyQuotaUsed.get(key) || 0;
          return used < QUOTA_LIMIT_PER_KEY;
        });
        
        if (availableKeys.length === 0) {
          console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다.");
          break;
        }
      }
      
      if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
        break;
      }
    }
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

