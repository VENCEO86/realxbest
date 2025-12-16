/**
 * 주간 채널 업데이트 스크립트
 * 기존 채널의 통계 정보만 업데이트 (신규 수집 없음)
 * 할당량 절약을 위해 주 1회 실행 권장
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API 키 관리
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const exhaustedKeys = new Set<string>();
const QUOTA_LIMIT_PER_KEY = 9000;

function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => !exhaustedKeys.has(key));
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 할당량이 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  return key;
}

async function updateChannelStats(channelIds: string[]): Promise<number> {
  if (channelIds.length === 0) return 0;
  
  const apiKey = getNextApiKey();
  const batchSize = 50;
  let updated = 0;
  
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
          
          await prisma.youTubeChannel.update({
            where: { channelId: item.id },
            data: {
              channelName: snippet.title,
              subscriberCount: BigInt(parseInt(stats.subscriberCount || "0")),
              totalViewCount: BigInt(parseInt(stats.viewCount || "0")),
              videoCount: parseInt(stats.videoCount || "0"),
              profileImageUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
              handle: snippet.customUrl?.replace("@", "") || null,
              description: snippet.description || null,
              lastUpdated: new Date(),
            },
          });
          
          updated++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ 배치 오류:`, error.message);
    }
  }
  
  return updated;
}

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    console.log("🔄 기존 채널 통계 업데이트 시작...\n");

    // 업데이트 대상: 최근 7일 이내 업데이트되지 않은 채널
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const channelsToUpdate = await prisma.youTubeChannel.findMany({
      where: {
        OR: [
          { lastUpdated: { lt: sevenDaysAgo } },
          { lastUpdated: null },
        ],
      },
      select: {
        channelId: true,
        channelName: true,
      },
      take: 1000, // 한 번에 최대 1000개만 업데이트 (할당량 절약)
    });
    
    console.log(`📊 업데이트 대상: ${channelsToUpdate.length}개 채널\n`);
    
    if (channelsToUpdate.length === 0) {
      console.log("✅ 업데이트할 채널이 없습니다.\n");
      return;
    }
    
    const channelIds = channelsToUpdate.map(ch => ch.channelId);
    const updated = await updateChannelStats(channelIds);
    
    console.log(`\n✅ 업데이트 완료: ${updated}개 채널\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

