/**
 * 원격 데이터베이스 데이터 수집 상태 확인 스크립트
 * Render PostgreSQL 데이터베이스 연결 및 데이터 확인
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 데이터 수집 상태 확인 중...\n");

  try {
    // 데이터베이스 연결 확인
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 스키마 확인 - Channel 또는 YouTubeChannel 모델 확인
    let totalChannels = 0;
    let modelName = "";

    try {
      // YouTubeChannel 모델 시도
      totalChannels = await (prisma as any).youTubeChannel.count();
      modelName = "YouTubeChannel";
    } catch (e) {
      try {
        // Channel 모델 시도
        totalChannels = await (prisma as any).channel.count();
        modelName = "Channel";
      } catch (e2) {
        console.error("❌ 채널 모델을 찾을 수 없습니다.");
        throw e2;
      }
    }

    console.log(`📊 전체 채널 수: ${totalChannels.toLocaleString()}개 (모델: ${modelName})\n`);

    if (totalChannels === 0) {
      console.log("⚠️  데이터베이스에 채널 데이터가 없습니다.");
      console.log("   GitHub Actions가 실행되었는지 확인하세요.\n");
      return;
    }

    // 최근 업데이트된 채널 확인
    let recentChannels: any[] = [];
    try {
      if (modelName === "YouTubeChannel") {
        recentChannels = await (prisma as any).youTubeChannel.findMany({
          take: 10,
          orderBy: {
            lastUpdated: "desc",
          },
          select: {
            channelId: true,
            channelName: true,
            country: true,
            lastUpdated: true,
            subscriberCount: true,
          },
        });
      } else {
        recentChannels = await (prisma as any).channel.findMany({
          take: 10,
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            name: true,
            countryCode: true,
            updatedAt: true,
            subscriberCount: true,
          },
        });
      }
    } catch (e) {
      console.log("⚠️  최근 채널 조회 실패:", e);
    }

    if (recentChannels.length > 0) {
      console.log("🕐 최근 업데이트된 채널 (최대 10개):");
      for (const channel of recentChannels) {
        const name = channel.channelName || channel.name || "Unknown";
        const country = channel.country || channel.countryCode || "Unknown";
        const updatedAt = channel.lastUpdated || channel.updatedAt;
        const subscribers = channel.subscriberCount || 0;
        const timeAgo = getTimeAgo(updatedAt);
        console.log(`  - ${name} (${country}): ${subscribers.toLocaleString()}명, ${timeAgo} 전`);
      }
      console.log("");
    }

    // 카테고리 확인
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              channels: true,
            },
          },
        },
      });

      if (categories.length > 0) {
        console.log("📁 카테고리별 채널 수:");
        for (const cat of categories) {
          const count = (cat as any)._count?.channels || 0;
          console.log(`  ${cat.name}: ${count.toLocaleString()}개`);
        }
        console.log("");
      }
    } catch (e) {
      console.log("⚠️  카테고리 조회 실패:", e);
    }

    console.log("========================================");
    console.log("📊 데이터 수집 상태 요약");
    console.log("========================================\n");
    console.log(`전체 채널 수: ${totalChannels.toLocaleString()}개`);
    console.log(`데이터 모델: ${modelName}`);
    if (recentChannels.length > 0) {
      const latestUpdate = recentChannels[0].lastUpdated || recentChannels[0].updatedAt;
      console.log(`최근 업데이트: ${getTimeAgo(latestUpdate)} 전`);
    }

  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    
    if (error.code === "P1001" || error.message.includes("connection")) {
      console.error("\n⚠️  데이터베이스 연결 실패");
      console.error("   DATABASE_URL 환경 변수를 확인하세요.");
      console.error("   Render PostgreSQL External Connection String을 사용해야 합니다.");
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}분`;
  } else if (diffHours < 24) {
    return `${diffHours}시간`;
  } else {
    return `${diffDays}일`;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

