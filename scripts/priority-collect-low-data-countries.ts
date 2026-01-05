/**
 * 데이터가 적거나 없는 국가 우선 수집 스크립트
 * 오늘자 기준으로 데이터가 부족한 국가를 우선적으로 수집
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
const dailyQuotaUsed = new Map<string, number>();
const exhaustedKeys = new Set<string>();
const QUOTA_LIMIT_PER_KEY = 9000;

// 최소 기준
const MIN_SUBSCRIBER_COUNT = 30000; // 최소 3만명 이상
const MIN_VIEW_COUNT = 1000000; // 최소 100만 조회수 이상
const TARGET_CHANNELS_PER_COUNTRY = 200; // 국가당 목표 채널 수

// 국가별 최소 기준
const COUNTRY_MIN_STANDARDS: Record<string, { subscribers: number; views: number }> = {
  IT: { subscribers: 50000, views: 2000000 },
  US: { subscribers: 50000, views: 2000000 },
  MX: { subscribers: 50000, views: 2000000 },
  CA: { subscribers: 50000, views: 2000000 },
  default: { subscribers: 30000, views: 1000000 },
};

// 국가별 언어 코드
const COUNTRY_LANGUAGE_CODES: Record<string, string> = {
  KR: "ko", JP: "ja", CN: "zh", TH: "th", VN: "vi", ID: "id", MY: "ms", PH: "en",
  IN: "hi", BD: "bn", PK: "ur", SG: "en", TW: "zh-TW", HK: "zh-HK",
  IT: "it", ES: "es", FR: "fr", DE: "de", PT: "pt", NL: "nl", PL: "pl", RU: "ru",
  GR: "el", TR: "tr", CH: "de", AT: "de", BE: "nl", SE: "sv", NO: "no", DK: "da",
  FI: "fi", IE: "en", IL: "he",
  US: "en", CA: "en", MX: "es", BR: "pt", AR: "es", CL: "es", CO: "es", PE: "es",
  EC: "es", UY: "es", BO: "es", AU: "en", NZ: "en",
  SA: "ar", AE: "ar", EG: "ar",
};

// 국가별 키워드 (간소화 버전)
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  KR: ["korean youtuber", "한국 유튜버", "korean channel", "한국 채널"],
  JP: ["japanese youtuber", "日本のユーチューバー", "japanese channel"],
  CN: ["chinese youtuber", "中国youtuber", "chinese channel"],
  ES: ["spanish youtuber", "youtuber español", "canal español"],
  FR: ["french youtuber", "youtuber français", "chaîne française"],
  DE: ["german youtuber", "deutscher youtuber", "deutscher kanal"],
  IN: ["indian youtuber", "indian channel", "hindi youtuber"],
  GB: ["british youtuber", "uk youtuber", "british channel"],
  BR: ["brazilian youtuber", "youtuber brasileiro", "canal brasileiro"],
  AU: ["australian youtuber", "australian channel"],
  NL: ["dutch youtuber", "nederlandse youtuber"],
  PL: ["polish youtuber", "polski youtuber"],
  TR: ["turkish youtuber", "türk youtuber"],
  default: ["youtuber", "channel", "top channel"],
};

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
    console.log(`  ⚠️ API 키 할당량 소진: ${key.substring(0, 20)}...`);
  }
}

async function searchChannels(
  query: string,
  maxResults: number = 50,
  regionCode?: string,
  languageCode?: string
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  incrementApiUsage(apiKey, 100);
  
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "channel",
      maxResults: String(Math.min(maxResults, 50)),
      order: "viewCount",
      key: apiKey,
    });
    
    if (regionCode) {
      params.append("regionCode", regionCode);
    }
    
    if (languageCode) {
      params.append("hl", languageCode);
      params.append("relevanceLanguage", languageCode);
    }
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY);
        throw new Error(`API 키 할당량 소진`);
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
    console.error(`  ❌ 검색 실패: ${error.message}`);
    return [];
  }
}

async function fetchChannelDetails(channelIds: string[]): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  incrementApiUsage(apiKey, 1); // Channels API는 1 unit
  
  try {
    const params = new URLSearchParams({
      part: "snippet,statistics,brandingSettings",
      id: channelIds.join(","),
      key: apiKey,
    });
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        incrementApiUsage(apiKey, QUOTA_LIMIT_PER_KEY);
        throw new Error(`API 키 할당량 소진`);
      }
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error: any) {
    console.error(`  ❌ 채널 상세 정보 가져오기 실패: ${error.message}`);
    return [];
  }
}

async function saveChannel(channelData: any, countryCode: string, categoryId: string) {
  try {
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      // 기존 채널은 업데이트만 (API 할당량 절약)
      return false;
    }
    
    const standards = COUNTRY_MIN_STANDARDS[countryCode] || COUNTRY_MIN_STANDARDS.default;
    const subscriberCount = parseInt(channelData.subscriberCount || "0");
    const viewCount = parseInt(channelData.totalViewCount || "0");
    
    if (subscriberCount < standards.subscribers || viewCount < standards.views) {
      return false;
    }
    
    await prisma.youTubeChannel.create({
      data: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        categoryId: categoryId,
        subscriberCount: BigInt(subscriberCount),
        totalViewCount: BigInt(viewCount),
        videoCount: parseInt(channelData.videoCount || "0"),
        country: countryCode,
        description: channelData.description,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ 저장 실패: ${error.message}`);
    return false;
  }
}

async function collectForCountry(countryCode: string, countryName: string) {
  console.log(`\n🌍 ${countryName} (${countryCode}) 수집 시작...`);
  
  // 현재 채널 수 확인
  const existingCount = await prisma.youTubeChannel.count({
    where: {
      country: countryCode,
      subscriberCount: { gte: BigInt(MIN_SUBSCRIBER_COUNT) },
      totalViewCount: { gte: BigInt(MIN_VIEW_COUNT) },
    },
  });
  
  console.log(`  📊 현재 채널 수: ${existingCount}개`);
  
  if (existingCount >= TARGET_CHANNELS_PER_COUNTRY) {
    console.log(`  ✅ 이미 목표치(${TARGET_CHANNELS_PER_COUNTRY}개)를 달성했습니다.`);
    return { collected: 0, saved: 0 };
  }
  
  const needToCollect = TARGET_CHANNELS_PER_COUNTRY - existingCount;
  console.log(`  🎯 목표: ${TARGET_CHANNELS_PER_COUNTRY}개 (추가 필요: ${needToCollect}개)`);
  
  // 카테고리 가져오기
  const category = await prisma.category.findFirst({
    where: { name: "엔터테인먼트" },
  });
  
  if (!category) {
    console.log(`  ❌ 카테고리를 찾을 수 없습니다.`);
    return { collected: 0, saved: 0 };
  }
  
  // 키워드 가져오기
  const keywords = COUNTRY_KEYWORDS[countryCode] || COUNTRY_KEYWORDS.default;
  const languageCode = COUNTRY_LANGUAGE_CODES[countryCode];
  
  let totalCollected = 0;
  let totalSaved = 0;
  
  // 각 키워드로 검색
  for (const keyword of keywords.slice(0, 3)) { // 상위 3개 키워드만 사용
    if (totalSaved >= needToCollect) break;
    
    console.log(`  🔍 키워드 검색: "${keyword}"`);
    
    const searchResults = await searchChannels(keyword, 50, countryCode, languageCode);
    totalCollected += searchResults.length;
    
    if (searchResults.length === 0) continue;
    
    // 배치로 상세 정보 가져오기 (50개씩)
    for (let i = 0; i < searchResults.length; i += 50) {
      const batch = searchResults.slice(i, i + 50);
      const channelIds = batch.map(c => c.channelId);
      
      const details = await fetchChannelDetails(channelIds);
      
      for (const detail of details) {
        const channelData = {
          channelId: detail.id,
          channelName: detail.snippet.title,
          handle: detail.snippet.customUrl?.replace("@", "") || null,
          profileImageUrl: detail.snippet.thumbnails?.high?.url || null,
          subscriberCount: detail.statistics.subscriberCount || "0",
          totalViewCount: detail.statistics.viewCount || "0",
          videoCount: detail.statistics.videoCount || "0",
          description: detail.snippet.description || null,
        };
        
        const saved = await saveChannel(channelData, countryCode, category.id);
        if (saved) {
          totalSaved++;
          console.log(`    ✅ 저장: ${channelData.channelName} (${channelData.subscriberCount}명)`);
        }
        
        if (totalSaved >= needToCollect) break;
      }
      
      // API 할당량 고려하여 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`  📊 수집 완료: 발견 ${totalCollected}개, 저장 ${totalSaved}개`);
  
  return { collected: totalCollected, saved: totalSaved };
}

async function main() {
  console.log("🚀 데이터 부족 국가 우선 수집 시작...\n");
  
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("❌ YOUTUBE_API_KEYS 환경 변수가 설정되지 않았습니다.");
    process.exit(1);
  }
  
  console.log(`✅ API 키 ${YOUTUBE_API_KEYS.length}개 사용 가능\n`);
  
  // 국가별 현재 채널 수 확인
  const countryStats = new Map<string, number>();
  
  for (const country of COUNTRIES) {
    if (country.value === "all") continue; // 전체 지역 제외
    const count = await prisma.youTubeChannel.count({
      where: {
        country: country.value,
        subscriberCount: { gte: BigInt(MIN_SUBSCRIBER_COUNT) },
        totalViewCount: { gte: BigInt(MIN_VIEW_COUNT) },
      },
    });
    countryStats.set(country.value, count);
  }
  
  // 데이터가 적은 국가 우선순위 정렬 (0개 → 10개 미만 → 50개 미만)
  const priorityCountries = Array.from(countryStats.entries())
    .sort((a, b) => a[1] - b[1])
    .filter(([_, count]) => count < TARGET_CHANNELS_PER_COUNTRY)
    .slice(0, 20); // 상위 20개 국가만 수집
  
  console.log("📋 우선 수집 대상 국가:\n");
  priorityCountries.forEach(([code, count], index) => {
    const country = COUNTRIES.find(c => c.value === code);
    const status = count === 0 ? "❌ 없음" : count < 10 ? "⚠️ 매우 적음" : count < 50 ? "📊 적음" : "📈 보통";
    console.log(`  ${index + 1}. ${country?.label || code} (${code}): ${count}개 ${status}`);
  });
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  let totalCollected = 0;
  let totalSaved = 0;
  
  // 우선순위대로 수집
  for (const [countryCode, currentCount] of priorityCountries) {
    const country = COUNTRIES.find(c => c.value === countryCode);
    if (!country) continue;
    
    try {
      const result = await collectForCountry(countryCode, country.label);
      totalCollected += result.collected;
      totalSaved += result.saved;
      
      // API 할당량 체크
      const availableKeys = YOUTUBE_API_KEYS.filter(key => {
        if (exhaustedKeys.has(key)) return false;
        const used = dailyQuotaUsed.get(key) || 0;
        return used < QUOTA_LIMIT_PER_KEY;
      });
      
      if (availableKeys.length === 0) {
        console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다. 수집을 중단합니다.");
        break;
      }
    } catch (error: any) {
      console.error(`\n❌ ${country.label} 수집 실패: ${error.message}`);
      continue;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 최종 결과:");
  console.log(`  발견한 채널: ${totalCollected}개`);
  console.log(`  저장된 채널: ${totalSaved}개`);
  console.log(`  사용된 API 키: ${YOUTUBE_API_KEYS.length}개`);
  console.log(`  할당량 소진된 키: ${exhaustedKeys.size}개\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);

