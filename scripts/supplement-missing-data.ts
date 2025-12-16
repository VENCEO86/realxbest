/**
 * 스킵된 부분 보완 스크립트
 * 1. 카테고리별 데이터 부족 국가 보완
 * 2. 데이터가 없는 국가 수집
 * 3. 구독자 순위가 높은 채널 우선 수집
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

const CATEGORIES = [
  { id: "entertainment", name: "엔터테인먼트", nameEn: "Entertainment" },
  { id: "music", name: "음악", nameEn: "Music" },
  { id: "education", name: "교육", nameEn: "Education" },
  { id: "gaming", name: "게임", nameEn: "Gaming" },
  { id: "sports", name: "스포츠", nameEn: "Sports" },
  { id: "news", name: "뉴스/정치", nameEn: "News/Politics" },
  { id: "people", name: "인물/블로그", nameEn: "People/Blog" },
  { id: "howto", name: "노하우/스타일", nameEn: "Howto/Style" },
  { id: "other", name: "기타", nameEn: "Other" },
];

const MIN_REQUIRED_PER_CATEGORY = 100; // 카테고리당 최소 100개
const TARGET_PER_CATEGORY = 200; // 카테고리당 목표 200개

let currentKeyIndex = 0;
const exhaustedKeys = new Set<string>();
const dailyQuotaUsed = new Map<string, number>();
const QUOTA_LIMIT_PER_KEY = 9000;

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
 * 구독자 순위가 높은 채널 검색
 */
async function searchTopChannels(
  countryCode: string,
  countryName: string,
  categoryKeyword: string,
  maxResults: number = 50
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  incrementApiUsage(apiKey, 100); // Search API는 100 units
  
  try {
    const queries = [
      `top ${countryName} ${categoryKeyword} youtubers`,
      `best ${countryName} ${categoryKeyword} channels`,
      `most subscribed ${countryName} ${categoryKeyword}`,
      `highest subscribers ${countryName} ${categoryKeyword}`,
      `popular ${countryName} ${categoryKeyword} creators`,
    ];
    
    const allChannelIds = new Set<string>();
    
    for (const query of queries) {
      if (allChannelIds.size >= maxResults) break;
      
      const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "channel",
        maxResults: "50",
        order: "viewCount", // 구독자 순위 높은 채널 우선
        key: apiKey,
      });
      
      if (countryCode) {
        params.append("regionCode", countryCode);
      }
      
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          exhaustedKeys.add(apiKey);
          continue;
        }
        continue;
      }
      
      const data = await response.json();
      
      if (data.items) {
        for (const item of data.items) {
          if (item.id?.channelId) {
            allChannelIds.add(item.id.channelId);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return Array.from(allChannelIds).map(channelId => ({
      channelId,
      channelName: "",
    }));
  } catch (error: any) {
    console.error(`  ❌ 검색 오류:`, error.message);
    return [];
  }
}

/**
 * 채널 상세 정보 가져오기 (구독자 수 기준 정렬)
 */
async function fetchChannelDetails(
  channelIds: string[],
  minSubscribers: number = 1000
): Promise<any[]> {
  if (channelIds.length === 0) return [];
  
  const apiKey = getNextApiKey();
  const batchSize = 50;
  const results: any[] = [];
  
  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);
    incrementApiUsage(apiKey, 1);
    
    try {
      const ids = batch.join(",");
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${apiKey}`
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          exhaustedKeys.add(apiKey);
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
          
          if (subscriberCount >= minSubscribers && viewCount >= 1000) {
            results.push({
              channelId: item.id,
              channelName: snippet.title,
              handle: snippet.customUrl?.replace("@", "") || null,
              profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
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
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ 배치 오류:`, error.message);
    }
  }
  
  // 구독자 수 기준 정렬 (높은 순)
  return results.sort((a, b) => b.subscriberCount - a.subscriberCount);
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
      data: { name, nameEn },
    });
  }
  
  return category.id;
}

/**
 * 채널 저장
 */
async function saveChannel(channelData: any, categoryId: string, countryCode: string): Promise<boolean> {
  try {
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      return false;
    }
    
    const actualCountryCode = channelData.country || countryCode;
    
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
 * 국가별 카테고리별 데이터 보완
 */
async function supplementCountryCategory(
  countryCode: string,
  countryName: string,
  category: typeof CATEGORIES[0]
): Promise<number> {
  const categoryId = await getOrCreateCategory(category.name, category.nameEn);
  
  // 현재 채널 수 확인
  const currentCount = await prisma.youTubeChannel.count({
    where: {
      country: countryCode,
      categoryId,
      subscriberCount: { gte: BigInt(100) },
      totalViewCount: { gte: BigInt(1000) },
    },
  });
  
  // 최소 개수 달성 시 스킵
  if (currentCount >= MIN_REQUIRED_PER_CATEGORY) {
    return 0;
  }
  
  const needToCollect = TARGET_PER_CATEGORY - currentCount;
  console.log(`  📂 ${category.name}: ${currentCount}개 → ${TARGET_PER_CATEGORY}개 목표 (${needToCollect}개 필요)`);
  
  // 구독자 순위가 높은 채널 검색
  const categoryKeywords: Record<string, string[]> = {
    entertainment: ["entertainment", "funny", "comedy"],
    music: ["music", "song", "artist"],
    education: ["education", "tutorial", "learn"],
    gaming: ["gaming", "game", "playthrough"],
    sports: ["sports", "football", "basketball"],
    news: ["news", "politics", "current events"],
    people: ["vlog", "lifestyle", "daily"],
    howto: ["howto", "tutorial", "tips"],
    other: ["popular", "trending", "top"],
  };
  const keywords = categoryKeywords[category.id] || [category.id];
  const categoryKeyword = keywords[0] || category.id;
  const channelIds = await searchTopChannels(countryCode, countryName, categoryKeyword, needToCollect * 2);
  
  if (channelIds.length === 0) {
    return 0;
  }
  
  // 채널 상세 정보 가져오기 (구독자 수 기준 정렬)
  const channelDetails = await fetchChannelDetails(channelIds.map(ch => ch.channelId), 1000);
  
  // 상위 채널만 저장 (구독자 수 기준)
  const topChannels = channelDetails.slice(0, needToCollect);
  
  let savedCount = 0;
  for (const channel of topChannels) {
    const saved = await saveChannel(channel, categoryId, countryCode);
    if (saved) savedCount++;
  }
  
  return savedCount;
}

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    if (YOUTUBE_API_KEYS.length === 0) {
      console.error("❌ YouTube API 키가 설정되지 않았습니다.");
      process.exit(1);
    }
    
    console.log("🔍 스킵된 부분 보완 시작...\n");
    
    // 1단계: 데이터가 있는 국가의 카테고리별 부족 데이터 보완
    console.log("📊 1단계: 카테고리별 데이터 부족 국가 보완\n");
    
    const countriesWithData = ["IT", "US", "CA"];
    let totalSupplemented = 0;
    
    for (const countryCode of countriesWithData) {
      const country = COUNTRIES.find(c => c.value === countryCode);
      if (!country) continue;
      
      console.log(`\n🌍 ${country.label} (${countryCode}) 보완 중...\n`);
      
      for (const category of CATEGORIES) {
        try {
          const saved = await supplementCountryCategory(countryCode, country.label, category);
          totalSupplemented += saved;
          
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
          console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다.");
          break;
        }
      }
      
      if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
        break;
      }
    }
    
    // 2단계: 데이터가 없는 국가 수집 (할당량이 남아있을 경우)
    if (exhaustedKeys.size < YOUTUBE_API_KEYS.length) {
      console.log("\n\n📊 2단계: 데이터가 없는 국가 수집\n");
      
      const emptyCountries = COUNTRIES.filter(c => 
        c.value !== "all" && !countriesWithData.includes(c.value)
      );
      
      for (const country of emptyCountries.slice(0, 10)) { // 최대 10개 국가만
        const currentCount = await prisma.youTubeChannel.count({
          where: { country: country.value },
        });
        
        if (currentCount > 0) continue;
        
        console.log(`\n🌍 ${country.label} (${country.value}) 수집 중...\n`);
        
        for (const category of CATEGORIES.slice(0, 5)) { // 주요 카테고리만
          try {
            const saved = await supplementCountryCategory(country.value, country.label, category);
            totalSupplemented += saved;
            
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error: any) {
            console.error(`  ❌ 오류: ${category.name}`, error.message);
          }
        }
        
        if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
          break;
        }
      }
    }
    
    console.log(`\n\n✅ 보완 완료!`);
    console.log(`📊 총 보완: ${totalSupplemented}개 채널\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

