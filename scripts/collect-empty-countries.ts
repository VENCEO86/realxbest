/**
 * 데이터가 없는 국가에 집중하여 인플루언서 수집
 * 구독자 순위가 높은 채널 우선 수집
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

let currentKeyIndex = 0;
const exhaustedKeys = new Set<string>();

function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => !exhaustedKeys.has(key));
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 할당량이 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  return key;
}

/**
 * 국가별 채널 수 확인
 */
async function getCountryChannelCount(countryCode: string): Promise<number> {
  return await prisma.youTubeChannel.count({
    where: {
      country: countryCode,
    },
  });
}

/**
 * 구독자 순위가 높은 채널 검색 (구독자 수 기준 정렬)
 */
async function searchTopChannelsBySubscribers(
  countryCode: string,
  countryName: string,
  maxResults: number = 50
): Promise<Array<{ channelId: string; channelName: string }>> {
  const apiKey = getNextApiKey();
  
  try {
    // 국가별 인기 채널 검색 (구독자 수 기준)
    const queries = [
      `top ${countryName} youtubers`,
      `best ${countryName} channels`,
      `most subscribed ${countryName}`,
      `highest subscribers ${countryName}`,
      `popular ${countryName} creators`,
      `${countryName} top channels`,
      `${countryName} famous youtubers`,
    ];
    
    const allChannelIds = new Set<string>();
    
    for (const query of queries) {
      if (allChannelIds.size >= maxResults) break;
      
      const params = new URLSearchParams({
        part: "snippet",
        q: query,
        type: "channel",
        maxResults: "50",
        order: "viewCount", // 조회수 기준 (인기 채널)
        key: apiKey,
      });
      
      // 국가 필터링
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
      channelName: "", // 상세 정보에서 가져올 예정
    }));
  } catch (error: any) {
    console.error(`  ❌ 검색 오류 (${countryName}):`, error.message);
    return [];
  }
}

/**
 * 채널 상세 정보 가져오기 (구독자 수 기준 필터링)
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
          
          // 구독자 수 기준 필터링 (최소 1000명 이상)
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
 * 채널 저장
 */
async function saveChannel(channelData: any, categoryId: string, countryCode: string): Promise<boolean> {
  try {
    const existing = await prisma.youTubeChannel.findUnique({
      where: { channelId: channelData.channelId },
    });
    
    if (existing) {
      return false; // 이미 존재
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
    console.error(`  ❌ 채널 저장 실패:`, error.message);
    return false;
  }
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
 * 데이터가 없는 국가에 집중하여 수집
 */
async function collectForEmptyCountry(countryCode: string, countryName: string): Promise<number> {
  console.log(`\n🌍 ${countryName} (${countryCode}) 수집 시작...`);
  
  const currentCount = await getCountryChannelCount(countryCode);
  
  if (currentCount > 0) {
    console.log(`  ⏭️ 이미 ${currentCount}개 채널이 있습니다. 스킵합니다.`);
    return 0;
  }
  
  console.log(`  🎯 데이터가 없는 국가입니다. 집중 수집 시작...`);
  
  // 각 카테고리별로 최소 10개씩 수집 (총 90개 목표)
  let totalSaved = 0;
  
  for (const category of CATEGORIES) {
    const categoryId = await getOrCreateCategory(category.name, category.nameEn);
    
    console.log(`    📂 ${category.name} 카테고리 수집 중...`);
    
    // 구독자 순위가 높은 채널 검색
    const channelIds = await searchTopChannelsBySubscribers(countryCode, countryName, 20);
    
    if (channelIds.length === 0) {
      console.log(`      ⚠️ 채널을 찾을 수 없습니다.`);
      continue;
    }
    
    // 채널 상세 정보 가져오기 (구독자 수 기준 정렬)
    const channelDetails = await fetchChannelDetails(
      channelIds.map(ch => ch.channelId),
      1000 // 최소 1000명 구독자
    );
    
    console.log(`      📊 ${channelDetails.length}개 채널 상세 정보 수집 완료`);
    
    // 상위 10개만 저장 (구독자 수 기준)
    const topChannels = channelDetails.slice(0, 10);
    
    for (const channel of topChannels) {
      const saved = await saveChannel(channel, categoryId, countryCode);
      if (saved) {
        totalSaved++;
      }
    }
    
    console.log(`      💾 ${topChannels.length}개 채널 저장 완료`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`  ✅ ${countryName} 수집 완료: ${totalSaved}개 채널 저장`);
  
  return totalSaved;
}

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    if (YOUTUBE_API_KEYS.length === 0) {
      console.error("❌ YouTube API 키가 설정되지 않았습니다.");
      process.exit(1);
    }
    
    // 모든 국가 확인
    const countries = COUNTRIES.filter(c => c.value !== "all");
    
    console.log("🔍 데이터가 없는 국가 확인 중...\n");
    
    const emptyCountries: Array<{ code: string; name: string }> = [];
    
    for (const country of countries) {
      const count = await getCountryChannelCount(country.value);
      if (count === 0) {
        emptyCountries.push({ code: country.value, name: country.label });
      }
    }
    
    console.log(`📊 데이터가 없는 국가: ${emptyCountries.length}개\n`);
    
    if (emptyCountries.length === 0) {
      console.log("✅ 모든 국가에 데이터가 있습니다!\n");
      return;
    }
    
    // 데이터가 없는 국가에 집중하여 수집
    let totalCollected = 0;
    
    for (const country of emptyCountries) {
      try {
        const saved = await collectForEmptyCountry(country.code, country.name);
        totalCollected += saved;
        
        // 할당량 체크
        if (exhaustedKeys.size >= YOUTUBE_API_KEYS.length) {
          console.log("\n⚠️ 모든 API 키의 할당량이 소진되었습니다.");
          break;
        }
      } catch (error: any) {
        console.error(`  ❌ 오류: ${country.name}`, error.message);
      }
    }
    
    console.log(`\n\n✅ 수집 완료!`);
    console.log(`📊 총 수집: ${totalCollected}개 채널`);
    console.log(`🌍 처리된 국가: ${emptyCountries.length}개\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);


