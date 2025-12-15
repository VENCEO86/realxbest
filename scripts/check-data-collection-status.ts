/**
 * 데이터 수집 상태 확인 스크립트
 * GitHub Actions 실행 여부 및 데이터베이스 데이터 확인
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 데이터 수집 상태 확인 중...\n");

  try {
    // 데이터베이스 연결 확인
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 전체 채널 수 확인
    const totalChannels = await prisma.youTubeChannel.count();
    console.log(`📊 전체 채널 수: ${totalChannels.toLocaleString()}개\n`);

    // 국가별 채널 수 확인
    const channelsByCountry = await prisma.youTubeChannel.groupBy({
      by: ["country"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    console.log("🌍 국가별 채널 수:");
    for (const item of channelsByCountry) {
      console.log(`  ${item.country || "Unknown"}: ${item._count.id.toLocaleString()}개`);
    }
    console.log("");

    // 카테고리별 채널 수 확인
    const channelsByCategory = await prisma.youTubeChannel.groupBy({
      by: ["categoryId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    console.log("📁 카테고리별 채널 수:");
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    for (const item of channelsByCategory) {
      const categoryName = categoryMap.get(item.categoryId) || "Unknown";
      console.log(`  ${categoryName}: ${item._count.id.toLocaleString()}개`);
    }
    console.log("");

    // 국가별 + 카테고리별 채널 수 확인
    const channelsByCountryCategory = await prisma.youTubeChannel.groupBy({
      by: ["country", "categoryId"],
      _count: {
        id: true,
      },
      orderBy: [
        {
          country: "asc",
        },
        {
          _count: {
            id: "desc",
          },
        },
      ],
    });

    console.log("🌍📁 국가별 + 카테고리별 채널 수:");
    const countryCategoryMap = new Map<string, Map<string, number>>();

    for (const item of channelsByCountryCategory) {
      const countryCode = item.country || "Unknown";
      if (!countryCategoryMap.has(countryCode)) {
        countryCategoryMap.set(countryCode, new Map());
      }
      const categoryName = categoryMap.get(item.categoryId) || "Unknown";
      countryCategoryMap.get(countryCode)!.set(categoryName, item._count.id);
    }

    for (const [countryCode, categoryMap] of countryCategoryMap) {
      console.log(`\n  ${countryCode}:`);
      for (const [categoryName, count] of categoryMap) {
        const status = count >= 100 ? "✅" : count >= 50 ? "⚠️" : "❌";
        console.log(`    ${status} ${categoryName}: ${count.toLocaleString()}개`);
      }
    }
    console.log("");

    // 최근 업데이트된 채널 확인
    const recentChannels = await prisma.youTubeChannel.findMany({
      take: 10,
      orderBy: {
        lastUpdated: "desc",
      },
      select: {
        id: true,
        channelName: true,
        country: true,
        lastUpdated: true,
      },
    });

    console.log("🕐 최근 업데이트된 채널 (최대 10개):");
    for (const channel of recentChannels) {
      const timeAgo = getTimeAgo(channel.lastUpdated);
      console.log(`  - ${channel.channelName} (${channel.country || "Unknown"}): ${timeAgo} 전`);
    }
    console.log("");

    // 최소 보장 개수 확인 (100개)
    const minRequired = 100;
    const belowMinimum = channelsByCountryCategory.filter(
      (item) => item._count.id < minRequired
    );

    if (belowMinimum.length > 0) {
      console.log(`⚠️  최소 보장 개수(${minRequired}개) 미달 항목:`);
      for (const item of belowMinimum) {
        const categoryName = categoryMap.get(item.categoryId) || "Unknown";
        const countryCode = item.country || "Unknown";
        console.log(`  - ${countryCode} - ${categoryName}: ${item._count.id}개`);
      }
      console.log("");
    } else {
      console.log(`✅ 모든 국가/카테고리별 최소 보장 개수(${minRequired}개) 달성!\n`);
    }

    // 목표 개수 확인 (300개)
    const targetCount = 300;
    const belowTarget = channelsByCountryCategory.filter(
      (item) => item._count.id < targetCount
    );

    if (belowTarget.length > 0) {
      console.log(`📈 목표 개수(${targetCount}개) 미달 항목:`);
      for (const item of belowTarget) {
        const categoryName = categoryMap.get(item.categoryId) || "Unknown";
        const countryCode = item.country || "Unknown";
        console.log(`  - ${countryCode} - ${categoryName}: ${item._count.id}개`);
      }
      console.log("");
    } else {
      console.log(`🎉 모든 국가/카테고리별 목표 개수(${targetCount}개) 달성!\n`);
    }

    // 요약
    console.log("========================================");
    console.log("📊 데이터 수집 상태 요약");
    console.log("========================================\n");
    console.log(`전체 채널 수: ${totalChannels.toLocaleString()}개`);
    console.log(`국가 수: ${channelsByCountry.length}개`);
    console.log(`카테고리 수: ${channelsByCategory.length}개`);
    console.log(`국가/카테고리 조합 수: ${channelsByCountryCategory.length}개`);
    console.log(`최소 보장 달성: ${belowMinimum.length === 0 ? "✅" : "⚠️"}`);
    console.log(`목표 달성: ${belowTarget.length === 0 ? "✅" : "📈"}`);

  } catch (error) {
    console.error("❌ 오류 발생:", error);
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

