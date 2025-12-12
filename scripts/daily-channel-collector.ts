/**
 * 데일리 자동 채널 수집 스크립트
 * 국가별/카테고리별 최소 300명 이상 확보
 * 속도 최적화 및 API 할당량 관리
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
const dailyQuotaUsed = new Map<string, number>(); // 키별 일일 사용량

// 목표 설정
const TARGET_CHANNELS_PER_COUNTRY_CATEGORY = 300;
const MIN_SUBSCRIBER_COUNT = 1000;
const MIN_VIEW_COUNT = 10000;

// 카테고리 목록
const CATEGORIES = [
  { id: "entertainment", name: "엔터테인먼트", keywords: ["entertainment", "funny", "comedy", "vlog"] },
  { id: "music", name: "음악", keywords: ["music", "song", "artist", "musician"] },
  { id: "education", name: "교육", keywords: ["education", "tutorial", "learn", "study"] },
  { id: "gaming", name: "게임", keywords: ["gaming", "game", "playthrough", "stream"] },
  { id: "sports", name: "스포츠", keywords: ["sports", "football", "basketball", "fitness"] },
  { id: "news", name: "뉴스/정치", keywords: ["news", "politics", "current events"] },
  { id: "people", name: "인물/블로그", keywords: ["vlog", "lifestyle", "daily", "blog"] },
  { id: "howto", name: "노하우/스타일", keywords: ["howto", "tutorial", "tips", "style"] },
  { id: "other", name: "기타", keywords: ["popular", "trending", "top"] },
];

/**
 * 다음 사용 가능한 API 키 가져오기
 */
function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => !exhaustedKeys.has(key));
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 쿼터가 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  keyUsageCount.set(key, (keyUsageCount.get(key) || 0) + 1);
  
  return key;
}

/**
 * API 키 소진 표시
 */
function markKeyExhausted(key: string) {
  exhaustedKeys.add(key);
  console.error(`  🚫 API 키 소진: ${key.substring(0, 20)}...`);
}

/**
 * YouTube Search API로 채널 검색
 */
async function searchChannels(
  query: string,
  maxResults: number = 50,
  regionCode?: string
): Promise<any[]> {
  const channels: any[] = [];
  
  try {
    const apiKey = getNextApiKey();
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
    
    if (regionCode) {
      url += `&regionCode=${regionCode}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        markKeyExhausted(apiKey);
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items) {
      for (const item of data.items) {
        if (item.snippet?.channelId) {
          channels.push({
            channelId: item.snippet.channelId,
            channelName: item.snippet.title,
            profileImageUrl: item.snippet.thumbnails?.high?.url,
            description: item.snippet.description,
          });
        }
      }
    }
  } catch (error: any) {
    if (error.message?.includes("403") || error.message?.includes("quota")) {
      console.error(`  ⚠️ API 쿼터 초과: ${query}`);
    } else {
      console.error(`  ❌ 검색 실패: ${query}`, error.message);
    }
  }
  
  return channels;
}

/**
 * 채널 상세 정보 가져오기 (배치)
 */
async function fetchChannelDetails(channelIds: string[]): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const batchSize = 50;
  const results: any[] = [];
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    
    try {
      const apiKey = getNextApiKey();
      const ids = batch.join(",");
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          markKeyExhausted(apiKey);
          continue;
        }
        continue;
      }
      
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          const stats = item.statistics || {};
          const snippet = item.snippet || {};
          
          const subscriberCount = BigInt(stats.subscriberCount || "0");
          const totalViewCount = BigInt(stats.viewCount || "0");
          const videoCount = parseInt(stats.videoCount || "0");
          
          // 최소 조건 확인
          if (subscriberCount < BigInt(MIN_SUBSCRIBER_COUNT) || 
              totalViewCount < BigInt(MIN_VIEW_COUNT)) {
            continue;
          }
          
          results.push({
            channelId: item.id,
            channelName: snippet.title || "",
            handle: snippet.customUrl?.replace("@", "") || null,
            profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
            subscriberCount,
            totalViewCount,
            videoCount,
            description: snippet.description || null,
            country: snippet.country || null,
            channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
          });
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ⚠️ 배치 처리 실패:`, error);
    }
  }
  
  return results;
}

/**
 * 카테고리 ID 가져오기 또는 생성
 */
async function getOrCreateCategory(categoryName: string, categoryNameEn: string): Promise<string> {
  let category = await prisma.category.findUnique({
    where: { name: categoryName },
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: categoryName,
        nameEn: categoryNameEn,
      },
    });
  }
  
  return category.id;
}

/**
 * 채널을 데이터베이스에 저장
 */
async function saveChannel(channelData: any, categoryId: string, countryCode?: string): Promise<boolean> {
  try {
    // 중복 확인
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      // 기존 채널 업데이트
      await prisma.youTubeChannel.update({
        where: { channelId: channelData.channelId },
        data: {
          channelName: channelData.channelName,
          handle: channelData.handle,
          profileImageUrl: channelData.profileImageUrl,
          subscriberCount: channelData.subscriberCount,
          totalViewCount: channelData.totalViewCount,
          videoCount: channelData.videoCount,
          description: channelData.description,
          country: countryCode || channelData.country,
          lastUpdated: new Date(),
        },
      });
      return false; // 새로 추가된 것이 아님
    }
    
    // 새 채널 생성
    await prisma.youTubeChannel.create({
      data: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        categoryId,
        subscriberCount: channelData.subscriberCount,
        totalViewCount: channelData.totalViewCount,
        videoCount: channelData.videoCount,
        description: channelData.description,
        country: countryCode || channelData.country,
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error: any) {
    if (error.code === "P2002") {
      // 중복 키 오류 (이미 존재)
      return false;
    }
    console.error(`  ❌ 저장 실패: ${channelData.channelId}`, error.message);
    return false;
  }
}

/**
 * 국가별/카테고리별 채널 수 확인
 */
async function getChannelCount(countryCode: string, categoryId: string): Promise<number> {
  return await prisma.youTubeChannel.count({
    where: {
      country: countryCode,
      categoryId,
      subscriberCount: { gte: BigInt(MIN_SUBSCRIBER_COUNT) },
      totalViewCount: { gte: BigInt(MIN_VIEW_COUNT) },
    },
  });
}

/**
 * 국가별/카테고리별 채널 수집
 */
async function collectChannelsForCountryCategory(
  countryCode: string,
  countryName: string,
  category: typeof CATEGORIES[0]
): Promise<{ collected: number; saved: number }> {
  const categoryId = await getOrCreateCategory(category.name, category.id);
  
  // 현재 채널 수 확인
  const currentCount = await getChannelCount(countryCode, categoryId);
  
  if (currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY) {
    console.log(`  ✅ ${countryName} - ${category.name}: ${currentCount}개 (목표 달성)`);
    return { collected: 0, saved: 0 };
  }
  
  const needToCollect = TARGET_CHANNELS_PER_COUNTRY_CATEGORY - currentCount;
  console.log(`  🎯 ${countryName} - ${category.name}: ${currentCount}/${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개 (${needToCollect}개 필요)`);
  
  const allChannelIds = new Set<string>();
  
  // 카테고리 키워드로 검색
  for (const keyword of category.keywords) {
    const queries = [
      `${countryName} ${keyword}`,
      `${keyword} ${countryName}`,
      `top ${countryName} ${keyword}`,
    ];
    
    for (const query of queries) {
      if (allChannelIds.size >= needToCollect * 2) break; // 여유있게 수집
      
      const channels = await searchChannels(query, 50, countryCode);
      for (const ch of channels) {
        if (ch.channelId) {
          allChannelIds.add(ch.channelId);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
    }
  }
  
  console.log(`    📊 ${allChannelIds.size}개 채널 ID 수집 완료`);
  
  // 배치로 상세 정보 가져오기
  const channelIdsArray = Array.from(allChannelIds);
  const channelDetails = await fetchChannelDetails(channelIdsArray);
  
  console.log(`    📊 ${channelDetails.length}개 채널 상세 정보 수집 완료`);
  
  // 데이터베이스에 저장
  let savedCount = 0;
  for (const channel of channelDetails) {
    const saved = await saveChannel(channel, categoryId, countryCode);
    if (saved) {
      savedCount++;
    }
  }
  
  const finalCount = await getChannelCount(countryCode, categoryId);
  console.log(`    ✅ 저장 완료: ${savedCount}개 새로 추가 (총 ${finalCount}개)`);
  
  return { collected: channelDetails.length, saved: savedCount };
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log("🚀 데일리 채널 수집 시작...\n");
  console.log(`📊 목표: 국가별/카테고리별 최소 ${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개\n`);
  
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ YouTube API 키가 설정되지 않았습니다.");
    process.exit(1);
  }
  
  console.log(`🔑 사용 가능한 API 키: ${YOUTUBE_API_KEYS.length}개\n`);
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const countries = COUNTRIES.filter(c => c.value !== "all");
    let totalCollected = 0;
    let totalSaved = 0;
    
    for (const country of countries) {
      console.log(`\n🌍 ${country.label} (${country.value}) 처리 중...\n`);
      
      for (const category of CATEGORIES) {
        try {
          const result = await collectChannelsForCountryCategory(
            country.value,
            country.label,
            category
          );
          
          totalCollected += result.collected;
          totalSaved += result.saved;
          
          // API 할당량 보호
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`  ❌ 오류: ${category.name}`, error.message);
        }
      }
    }
    
    console.log(`\n\n✅ 수집 완료!`);
    console.log(`📊 총 수집: ${totalCollected}개`);
    console.log(`💾 총 저장: ${totalSaved}개\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main().catch(console.error);

