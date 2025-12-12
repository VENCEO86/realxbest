/**
 * YouTube API를 사용하여 최대한 많은 채널을 수집하는 스크립트
 * 일일 쿼터를 최대한 활용하여 데이터를 풍성하게 만듭니다.
 * 
 * 사용법:
 *   npx tsx scripts/maximize-channel-collection.ts
 */

import { PrismaClient } from "@prisma/client";
import { searchChannels } from "@/lib/youtube-api";

const prisma = new PrismaClient();

// 확장된 검색 키워드 목록 (카테고리별)
const SEARCH_KEYWORDS = [
  // 교육 (Education)
  "education", "tutorial", "learning", "study", "course", "lesson", "online course",
  "수학", "과학", "영어", "한국어", "역사", "지리", "물리", "화학", "생물",
  "math", "science", "physics", "chemistry", "biology", "history", "geography",
  
  // 엔터테인먼트 (Entertainment)
  "entertainment", "comedy", "funny", "vlog", "daily", "lifestyle", "prank",
  "예능", "웃음", "브이로그", "일상", "라이프스타일", "코미디",
  
  // 음악 (Music)
  "music", "song", "artist", "musician", "band", "singer", "rapper", "dj",
  "음악", "가수", "아이돌", "K-pop", "힙합", "랩", "발라드", "록",
  "pop music", "rock music", "hip hop", "jazz", "classical",
  
  // 게임 (Gaming)
  "gaming", "game", "playthrough", "stream", "esports", "gameplay", "let's play",
  "게임", "플레이", "스트리밍", "e스포츠", "게임플레이", "레츠플레이",
  "minecraft", "fortnite", "valorant", "league of legends", "overwatch",
  
  // 스포츠 (Sports)
  "sports", "football", "soccer", "basketball", "baseball", "tennis", "golf",
  "스포츠", "축구", "야구", "농구", "테니스", "골프", "배구",
  "sports highlights", "sports news", "athlete",
  
  // 요리 (Cooking)
  "cooking", "recipe", "food", "chef", "baking", "restaurant", "cuisine",
  "요리", "레시피", "음식", "쿠킹", "베이킹", "맛집", "음식리뷰",
  
  // 뉴스/정치 (News/Politics)
  "news", "politics", "current events", "breaking news", "journalism",
  "뉴스", "정치", "시사", "뉴스분석", "보도",
  
  // 기술/IT (Tech)
  "technology", "tech", "programming", "coding", "software", "hardware",
  "기술", "프로그래밍", "코딩", "IT", "소프트웨어", "하드웨어",
  "computer science", "AI", "artificial intelligence", "machine learning",
  
  // 여행 (Travel)
  "travel", "tourism", "vacation", "adventure", "explore",
  "여행", "관광", "휴가", "모험", "탐험",
  
  // 뷰티/패션 (Beauty/Fashion)
  "beauty", "fashion", "makeup", "skincare", "style", "outfit",
  "뷰티", "패션", "메이크업", "스킨케어", "스타일", "코디",
  
  // 자동차 (Automotive)
  "car", "automotive", "vehicle", "driving", "review",
  "자동차", "차", "운전", "리뷰", "튜닝",
  
  // 애완동물 (Pets)
  "pets", "dog", "cat", "animal", "pet care",
  "애완동물", "강아지", "고양이", "동물", "반려동물",
];

// 국가별 검색 키워드
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  KR: ["한국", "Korea", "K-pop", "한국어", "서울", "부산", "인기", "트렌드"],
  US: ["USA", "America", "American", "United States", "popular", "trending"],
  JP: ["Japan", "Japanese", "일본", "도쿄", "오사카", "인기"],
  CN: ["China", "Chinese", "중국", "베이징", "상하이", "인기"],
  GB: ["UK", "Britain", "British", "London", "England", "popular"],
  CA: ["Canada", "Canadian", "Toronto", "Vancouver", "popular"],
  AU: ["Australia", "Australian", "Sydney", "Melbourne", "popular"],
  DE: ["Germany", "German", "Deutschland", "Berlin", "popular"],
  FR: ["France", "French", "Paris", "popular"],
  ES: ["Spain", "Spanish", "Madrid", "Barcelona", "popular"],
  IT: ["Italy", "Italian", "Rome", "Milan", "popular"],
  BR: ["Brazil", "Brazilian", "São Paulo", "Rio", "popular"],
  MX: ["Mexico", "Mexican", "Mexico City", "popular"],
  IN: ["India", "Indian", "Mumbai", "Delhi", "popular"],
  RU: ["Russia", "Russian", "Moscow", "popular"],
};

// 인기 채널 키워드
const POPULAR_KEYWORDS = [
  "popular", "trending", "top", "best", "most viewed", "most subscribed",
  "인기", "트렌드", "베스트", "최고", "조회수", "구독자",
  "viral", "famous", "celebrity", "star",
];

async function searchChannelsWithKeyword(keyword: string, maxResults: number = 50) {
  const apiKeys = (process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || "").split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (apiKeys.length === 0) {
    console.error("YouTube API 키가 설정되지 않았습니다.");
    return [];
  }

  // API 키 순환 사용
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  try {
    const channels = await searchChannels(keyword, maxResults, apiKey);
    
    // 최소 기준값 필터링 (구독자 1천명 이상, 조회수 1만 이상)
    const validChannels = channels.filter(
      (ch) => ch.subscriberCount >= 1000 && ch.totalViewCount >= 10000
    );
    
    return validChannels;
  } catch (error: any) {
    if (error.message?.includes("quota") || error.message?.includes("403")) {
      console.error(`  ⚠️  API 쿼터 소진 또는 권한 오류: ${keyword}`);
      return [];
    }
    console.error(`  ❌ "${keyword}" 검색 실패:`, error.message);
    return [];
  }
}

async function saveChannelToDatabase(channelData: any) {
  try {
    // 카테고리 추론
    let categoryName = "엔터테인먼트";
    const title = (channelData.channelName || "").toLowerCase();
    const description = (channelData.description || "").toLowerCase();
    const combined = `${title} ${description}`;
    
    if (combined.match(/education|tutorial|learning|study|course|lesson|수학|과학|영어|한국어|역사|지리|학습|교육/)) {
      categoryName = "교육";
    } else if (combined.match(/music|song|artist|musician|band|음악|가수|아이돌|K-pop|힙합|랩|발라드/)) {
      categoryName = "음악";
    } else if (combined.match(/gaming|game|playthrough|stream|esports|게임|플레이|스트리밍|e스포츠/)) {
      categoryName = "게임";
    } else if (combined.match(/sports|football|soccer|basketball|스포츠|축구|야구|농구/)) {
      categoryName = "스포츠";
    } else if (combined.match(/cooking|recipe|food|chef|요리|레시피|음식|쿠킹/)) {
      categoryName = "노하우/스타일";
    } else if (combined.match(/news|politics|뉴스|정치|시사/)) {
      categoryName = "뉴스/정치";
    } else if (combined.match(/technology|tech|programming|coding|기술|프로그래밍|코딩|IT/)) {
      categoryName = "교육"; // 기술은 교육으로 분류
    }
    
    // 카테고리 찾기 또는 생성
    let category = await prisma.category.findUnique({
      where: { name: categoryName },
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          nameEn: categoryName,
        },
      });
    }
    
    // 채널 저장 (upsert)
    await prisma.youTubeChannel.upsert({
      where: { channelId: channelData.channelId },
      update: {
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        country: channelData.country,
        description: channelData.description,
        lastUpdated: new Date(),
      },
      create: {
        channelId: channelData.channelId,
        channelName: channelData.channelName,
        handle: channelData.handle,
        profileImageUrl: channelData.profileImageUrl,
        categoryId: category.id,
        subscriberCount: BigInt(channelData.subscriberCount),
        totalViewCount: BigInt(channelData.totalViewCount),
        videoCount: channelData.videoCount,
        country: channelData.country,
        description: channelData.description,
        channelCreatedAt: channelData.channelCreatedAt,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`  ❌ 채널 저장 실패 (${channelData.channelName}):`, error);
    return false;
  }
}

async function main() {
  console.log("🚀 최대 채널 수집 시작...\n");
  console.log("📊 목표: 일일 쿼터를 최대한 활용하여 데이터 풍성하게 만들기\n");
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const allCollectedChannels: any[] = [];
    const savedChannels = new Set<string>();
    let totalSearched = 0;
    let totalSaved = 0;
    
    // 1. 일반 키워드 검색 (일일 쿼터 10,000 units 내에서 최적화)
    // Search API: 100 units/요청, channels.list: 1 unit/요청
    // 안전하게 80개 검색 = 8,000 units, 나머지 2,000 units는 channels.list용
    console.log("📌 1단계: 카테고리별 키워드 검색\n");
    for (const keyword of SEARCH_KEYWORDS) {
      if (totalSearched >= 80) break; // Search API는 100 units/요청이므로 80개 = 8,000 units
      
      console.log(`🔍 "${keyword}" 검색 중...`);
      const channels = await searchChannelsWithKeyword(keyword, 50);
      totalSearched++;
      
      for (const channel of channels) {
        if (!savedChannels.has(channel.channelId)) {
          allCollectedChannels.push(channel);
          savedChannels.add(channel.channelId);
        }
      }
      
      console.log(`  ✅ ${channels.length}개 채널 발견 (총 ${allCollectedChannels.length}개 고유 채널)\n`);
      
      // Rate limiting 방지 (1초 대기)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    // 2. 국가별 키워드 검색 (이미 1단계에서 일부 사용했으므로 제한적으로)
    console.log("📌 2단계: 국가별 키워드 검색 (선택적)\n");
    // 1단계에서 이미 80개 검색했으므로, 국가별은 제한적으로만
    // 필요시 주석 해제하여 사용
    /*
    for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
      if (totalSearched >= 80) break;
      
      for (const keyword of keywords.slice(0, 1)) { // 각 국가당 1개 키워드만
        if (totalSearched >= 80) break;
        
        console.log(`🔍 "${keyword}" (${country}) 검색 중...`);
        const channels = await searchChannelsWithKeyword(keyword, 50);
        totalSearched++;
        
        for (const channel of channels) {
          if (!savedChannels.has(channel.channelId)) {
            channel.country = country; // 국가 정보 추가
            allCollectedChannels.push(channel);
            savedChannels.add(channel.channelId);
          }
        }
        
        console.log(`  ✅ ${channels.length}개 채널 발견 (총 ${allCollectedChannels.length}개 고유 채널)\n`);
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    */
    
    // 3. 인기 채널 키워드 검색 (선택적, 필요시 주석 해제)
    /*
    console.log("📌 3단계: 인기 채널 키워드 검색\n");
    for (const keyword of POPULAR_KEYWORDS.slice(0, 10)) {
      if (totalSearched >= 80) break;
      
      console.log(`🔍 "${keyword}" 검색 중...`);
      const channels = await searchChannelsWithKeyword(keyword, 50);
      totalSearched++;
      
      for (const channel of channels) {
        if (!savedChannels.has(channel.channelId)) {
          allCollectedChannels.push(channel);
          savedChannels.add(channel.channelId);
        }
      }
      
      console.log(`  ✅ ${channels.length}개 채널 발견 (총 ${allCollectedChannels.length}개 고유 채널)\n`);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    */
    
    console.log(`\n📊 총 ${allCollectedChannels.length}개 고유 채널 수집 완료\n`);
    console.log(`📊 총 ${totalSearched}개 검색 수행 (Search API 사용량: ${totalSearched * 100} units)`);
    console.log(`📊 예상 채널 수집: 약 ${allCollectedChannels.length}개 (키워드당 평균 30-50개)\n`);
    
    // 데이터베이스에 저장
    console.log("💾 데이터베이스에 저장 중...\n");
    
    for (let i = 0; i < allCollectedChannels.length; i++) {
      const channel = allCollectedChannels[i];
      const saved = await saveChannelToDatabase(channel);
      if (saved) {
        totalSaved++;
      }
      
      // 진행 상황 표시
      if ((i + 1) % 100 === 0) {
        console.log(`  💾 ${i + 1}/${allCollectedChannels.length}개 저장 중... (${totalSaved}개 성공)`);
      }
      
      // Rate limiting 방지
      if ((i + 1) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n✅ 완료! ${totalSaved}/${allCollectedChannels.length}개 채널 저장됨\n`);
    
    // 최종 통계
    const totalChannels = await prisma.youTubeChannel.count();
    const validChannels = await prisma.youTubeChannel.count({
      where: {
        subscriberCount: { gte: BigInt(1000) },
        totalViewCount: { gte: BigInt(10000) },
      },
    });
    
    console.log("📈 최종 통계:");
    console.log(`  - 데이터베이스 총 채널 수: ${totalChannels.toLocaleString()}개`);
    console.log(`  - 유효한 채널 수 (구독자 1천명 이상, 조회수 1만 이상): ${validChannels.toLocaleString()}개`);
    console.log(`  - 오늘 새로 추가된 채널: ${totalSaved.toLocaleString()}개\n`);
    
    // 카테고리별 통계
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { channels: true },
        },
      },
    });
    
    console.log("📊 카테고리별 채널 수:");
    categories.forEach((cat) => {
      console.log(`  - ${cat.name}: ${cat._count.channels.toLocaleString()}개`);
    });
    
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

