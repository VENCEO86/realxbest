/**
 * YouTube API를 사용하여 더 많은 채널을 수집하는 스크립트
 * 
 * 사용법:
 *   npx tsx scripts/collect-more-channels.ts
 */

import { PrismaClient } from "@prisma/client";
import { searchChannels } from "@/lib/youtube-api";

const prisma = new PrismaClient();

// 수집할 키워드 목록 (카테고리별)
const SEARCH_KEYWORDS = [
  // 교육
  "education", "tutorial", "learning", "study", "course", "lesson",
  "수학", "과학", "영어", "한국어", "역사", "지리",
  
  // 엔터테인먼트
  "entertainment", "comedy", "funny", "vlog", "daily",
  "예능", "웃음", "브이로그", "일상",
  
  // 음악
  "music", "song", "artist", "musician", "band",
  "음악", "가수", "아이돌", "K-pop",
  
  // 게임
  "gaming", "game", "playthrough", "stream", "esports",
  "게임", "플레이", "스트리밍", "e스포츠",
  
  // 스포츠
  "sports", "football", "soccer", "basketball", "baseball",
  "스포츠", "축구", "야구", "농구",
  
  // 요리
  "cooking", "recipe", "food", "chef",
  "요리", "레시피", "음식", "쿠킹",
];

// 국가별 검색 키워드
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  KR: ["한국", "Korea", "K-pop", "한국어"],
  US: ["USA", "America", "American"],
  JP: ["Japan", "Japanese", "일본"],
  CN: ["China", "Chinese", "중국"],
  GB: ["UK", "Britain", "British"],
  // 추가 국가...
};

async function collectChannelsByKeyword(keyword: string, maxResults: number = 50) {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS?.split(',')[0];
  
  if (!apiKey) {
    console.error("YouTube API 키가 설정되지 않았습니다.");
    return [];
  }

  try {
    console.log(`🔍 "${keyword}" 검색 중... (최대 ${maxResults}개)`);
    const channels = await searchChannels(keyword, maxResults, apiKey);
    
    // 최소 기준값 필터링 (구독자 1천명 이상, 조회수 1만 이상)
    const validChannels = channels.filter(
      (ch) => ch.subscriberCount >= 1000 && ch.totalViewCount >= 10000
    );
    
    console.log(`  ✅ ${validChannels.length}개 유효한 채널 발견`);
    return validChannels;
  } catch (error) {
    console.error(`  ❌ "${keyword}" 검색 실패:`, error);
    return [];
  }
}

async function saveChannelToDatabase(channelData: any) {
  try {
    // 카테고리 추론
    let categoryName = "엔터테인먼트";
    const title = channelData.channelName.toLowerCase();
    const description = (channelData.description || "").toLowerCase();
    
    if (title.includes("education") || title.includes("tutorial") || title.includes("학습") || title.includes("교육")) {
      categoryName = "교육";
    } else if (title.includes("music") || title.includes("음악") || title.includes("song")) {
      categoryName = "음악";
    } else if (title.includes("gaming") || title.includes("game") || title.includes("게임")) {
      categoryName = "게임";
    } else if (title.includes("sports") || title.includes("스포츠")) {
      categoryName = "스포츠";
    } else if (title.includes("cooking") || title.includes("recipe") || title.includes("요리")) {
      categoryName = "노하우/스타일";
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
  console.log("🚀 YouTube 채널 수집 시작...\n");
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    const allCollectedChannels: any[] = [];
    const savedChannels = new Set<string>();
    
    // 키워드별 채널 수집
    for (const keyword of SEARCH_KEYWORDS) {
      const channels = await collectChannelsByKeyword(keyword, 50);
      
      for (const channel of channels) {
        if (!savedChannels.has(channel.channelId)) {
          allCollectedChannels.push(channel);
          savedChannels.add(channel.channelId);
        }
      }
      
      // Rate limiting 방지
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 총 ${allCollectedChannels.length}개 고유 채널 수집 완료\n`);
    
    // 데이터베이스에 저장
    console.log("💾 데이터베이스에 저장 중...\n");
    let savedCount = 0;
    
    for (const channel of allCollectedChannels) {
      const saved = await saveChannelToDatabase(channel);
      if (saved) {
        savedCount++;
      }
      
      // Rate limiting 방지
      if (savedCount % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n✅ 완료! ${savedCount}/${allCollectedChannels.length}개 채널 저장됨\n`);
    
    // 최종 통계
    const totalChannels = await prisma.youTubeChannel.count();
    console.log(`📈 현재 데이터베이스 총 채널 수: ${totalChannels.toLocaleString()}개\n`);
    
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


