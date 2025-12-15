/**
 * 데일리 자동 채널 수집 시스템 (최적화 버전)
 * 국가별/카테고리별 최소 300명 이상 확보
 * 속도 최적화 및 API 할당량 관리
 */

import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "../lib/countries";

const prisma = new PrismaClient();

// API 키 관리 (다중 키 지원)
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const keyUsageCount = new Map<string, number>();
const exhaustedKeys = new Set<string>();
const dailyQuotaUsed = new Map<string, number>(); // 키별 일일 사용량
const QUOTA_LIMIT_PER_KEY = 9000; // 키당 일일 할당량 (안전 마진)

// 목표 설정
const TARGET_CHANNELS_PER_COUNTRY_CATEGORY = 300; // 최종 목표
const MIN_REQUIRED_CHANNELS = 100; // 최소 보장 개수 (광고 삽입을 위한 최소 데이터)
const MIN_SUBSCRIBER_COUNT = 1000;
const MIN_VIEW_COUNT = 10000;

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

/**
 * 다음 사용 가능한 API 키 가져오기 (할당량 체크)
 */
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

/**
 * API 키 사용량 증가
 */
function incrementApiUsage(key: string, units: number = 1) {
  const current = dailyQuotaUsed.get(key) || 0;
  dailyQuotaUsed.set(key, current + units);
  
  if (current + units >= QUOTA_LIMIT_PER_KEY) {
    exhaustedKeys.add(key);
    console.log(`  ⚠️ API 키 할당량 소진: ${key.substring(0, 20)}... (사용량: ${current + units})`);
  }
}

/**
 * 채널 검색 (YouTube Search API)
 */
async function searchChannels(
  query: string,
  maxResults: number = 50,
  regionCode?: string
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  incrementApiUsage(apiKey, 100); // Search API는 100 units
  
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(Math.min(maxResults, 50)),
      key: apiKey,
    });
    
    if (regionCode) {
      params.append("regionCode", regionCode);
    }
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY); // 할당량 소진으로 표시
        throw new Error(`API 키 할당량 소진: ${apiKey.substring(0, 20)}...`);
      }
      throw new Error(`YouTube API error: ${response.status}`);
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

/**
 * 채널 상세 정보 가져오기 (배치 처리)
 */
async function fetchChannelDetails(channelIds: string[]): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  const batchSize = 50; // YouTube API는 최대 50개씩
  const results: any[] = [];
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    incrementApiUsage(apiKey, 1); // Channels API는 1 unit
    
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
          
          // 최소 기준 필터링
          const subscriberCount = parseInt(stats.subscriberCount || "0");
          const viewCount = parseInt(stats.viewCount || "0");
          
          if (subscriberCount >= MIN_SUBSCRIBER_COUNT && viewCount >= MIN_VIEW_COUNT) {
            results.push({
              channelId: item.id,
              channelName: snippet.title,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
              subscriberCount,
              totalViewCount: viewCount,
              videoCount: parseInt(stats.videoCount || "0"),
              country: snippet.country || null,
              description: snippet.description || null,
              channelCreatedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : null,
            });
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ 배치 오류:`, error.message);
    }
  }
  
  return results;
}

/**
 * 카테고리 가져오기 또는 생성
 */
async function getOrCreateCategory(name: string, nameEn: string): Promise<string> {
  let category = await prisma.category.findUnique({
    where: { name },
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { 
        name, 
        nameEn,
      },
    });
  }
  
  return category.id;
}

/**
 * 현재 채널 수 확인
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
 * 채널 저장 (중복 체크)
 */
async function saveChannel(
  channelData: any,
  categoryId: string,
  countryCode: string
): Promise<boolean> {
  try {
    // 중복 체크
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      // 기존 채널 업데이트
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
        },
      });
      return false; // 새로 저장한 것이 아님
    }
    
    // 새 채널 저장
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
        country: countryCode,
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ 저장 오류 (${channelData.channelId}):`, error.message);
    return false;
  }
}

/**
 * 국가별/카테고리별 채널 수집
 */
async function collectChannelsForCountryCategory(
  countryCode: string,
  countryName: string,
  category: typeof CATEGORIES[0]
): Promise<{ collected: number; saved: number }> {
  const categoryId = await getOrCreateCategory(category.name, category.nameEn);
  
  // 현재 채널 수 확인
  const currentCount = await getChannelCount(countryCode, categoryId);
  
  // 최소 개수 미달 시 우선 수집
  if (currentCount < MIN_REQUIRED_CHANNELS) {
    const needToCollect = MIN_REQUIRED_CHANNELS - currentCount;
    console.log(`  ⚠️ ${countryName} - ${category.name}: ${currentCount}개 (최소 ${MIN_REQUIRED_CHANNELS}개 미달, ${needToCollect}개 긴급 수집 필요)`);
  } else if (currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY) {
    console.log(`  ✅ ${countryName} - ${category.name}: ${currentCount}개 (목표 달성, 기존 채널 업데이트 계속)`);
    // 목표 달성해도 기존 채널 업데이트는 수행 (데이터 롤링)
    // return { collected: 0, saved: 0 }; // 제거: 데이터 롤링을 위해 계속 진행
  }
  
  // 목표 달성 여부와 관계없이 최소 200개는 확보하도록 수집
  const needToCollect = currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY
    ? Math.max(200 - currentCount, 0) // 목표 달성 시에도 최소 200개 보장
    : Math.max(
        MIN_REQUIRED_CHANNELS - currentCount, // 최소 보장
        TARGET_CHANNELS_PER_COUNTRY_CATEGORY - currentCount // 목표 달성
      );
  
  console.log(`  🎯 ${countryName} - ${category.name}: ${currentCount}/${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개 (최소: ${MIN_REQUIRED_CHANNELS}개, ${needToCollect}개 필요)`);
  
  const allChannelIds = new Set<string>();
  
  // 기존 채널 ID도 가져와서 업데이트 대상으로 포함 (데이터 롤링)
  const existingChannels = await prisma.youTubeChannel.findMany({
    where: {
      country: countryCode,
      categoryId: categoryId,
    },
    select: {
      channelId: true,
    },
    take: 200, // 최대 200개 기존 채널 업데이트
  });
  
  existingChannels.forEach(ch => {
    if (ch.channelId) {
      allChannelIds.add(ch.channelId);
    }
  });
  
  // 카테고리 키워드로 검색 (순차 처리로 안정성 확보)
  // 목표 달성 시에도 새로운 채널 수집 (최소 200개 보장)
  const maxSearchResults = currentCount >= TARGET_CHANNELS_PER_COUNTRY_CATEGORY
    ? Math.max(200 - existingChannels.length, 50) // 목표 달성 시 최소 50개 추가 수집
    : needToCollect * 1.5;
  
  for (const keyword of category.keywords.slice(0, 10)) { // 키워드 5개 -> 10개로 증가
    const queries = [
      `${countryName} ${keyword}`,
      `${keyword} ${countryName}`,
      `top ${countryName} ${keyword}`,
      `best ${countryName} ${keyword}`,
      `popular ${countryName} ${keyword}`,
    ];
    
    for (const query of queries) {
      if (allChannelIds.size >= maxSearchResults) break;
      
      const channels = await searchChannels(query, 50, countryCode);
      for (const ch of channels) {
        if (ch.channelId) {
          allChannelIds.add(ch.channelId);
        }
      }
      
      // Rate limiting (API 할당량 보호)
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (allChannelIds.size >= maxSearchResults) break;
  }
  
  console.log(`    📊 ${allChannelIds.size}개 채널 ID 수집 완료`);
  
  if (allChannelIds.size === 0) {
    return { collected: 0, saved: 0 };
  }
  
  // 배치로 상세 정보 가져오기
  const channelIdsArray = Array.from(allChannelIds);
  const channelDetails = await fetchChannelDetails(channelIdsArray);
  
  console.log(`    📊 ${channelDetails.length}개 채널 상세 정보 수집 완료`);
  
  // 데이터베이스에 저장 (배치 처리)
  let savedCount = 0;
  const savePromises: Promise<boolean>[] = [];
  
  for (const channel of channelDetails) {
    savePromises.push(saveChannel(channel, categoryId, countryCode));
  }
  
  const saveResults = await Promise.all(savePromises);
  savedCount = saveResults.filter(r => r === true).length;
  
  console.log(`    💾 ${savedCount}개 새 채널 저장 완료`);
  
  return { collected: channelDetails.length, saved: savedCount };
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log("🚀 데일리 자동 채널 수집 시작...\n");
  console.log(`📊 목표: 국가별/카테고리별 최소 ${TARGET_CHANNELS_PER_COUNTRY_CATEGORY}개\n`);
  
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ YouTube API 키가 설정되지 않았습니다.");
    process.exit(1);
  }
  
  console.log(`🔑 사용 가능한 API 키: ${YOUTUBE_API_KEYS.length}개`);
  console.log(`📈 키당 할당량: ${QUOTA_LIMIT_PER_KEY} units\n`);
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const countries = COUNTRIES.filter(c => c.value !== "all");
    let totalCollected = 0;
    let totalSaved = 0;
    let processed = 0;
    const total = countries.length * CATEGORIES.length;
    
    for (const country of countries) {
      console.log(`\n🌍 ${country.label} (${country.value}) 처리 중...\n`);
      
      for (const category of CATEGORIES) {
        processed++;
        const progress = ((processed / total) * 100).toFixed(1);
        console.log(`[${progress}%] 진행 중...`);
        
        try {
          const result = await collectChannelsForCountryCategory(
            country.value,
            country.label,
            category
          );
          
          totalCollected += result.collected;
          totalSaved += result.saved;
          
          // API 할당량 보호
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
          console.error(`  ❌ 오류: ${category.name}`, error.message);
        }
        
        // 할당량 체크
        const availableKeys = YOUTUBE_API_KEYS.filter(key => {
          const used = dailyQuotaUsed.get(key) || 0;
          return used < QUOTA_LIMIT_PER_KEY;
        });
        
        if (availableKeys.length === 0) {
          console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다. 오늘 수집을 중단합니다.");
          break;
        }
      }
      
      if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
        break;
      }
    }
    
    console.log(`\n\n✅ 수집 완료!`);
    console.log(`📊 총 수집: ${totalCollected}개`);
    console.log(`💾 총 저장: ${totalSaved}개`);
    console.log(`🔑 사용된 API 키: ${YOUTUBE_API_KEYS.length - exhaustedKeys.size}/${YOUTUBE_API_KEYS.length}개\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main().catch(console.error);

