/**
 * 최종 헬스 체크 스크립트
 * 호환성, 연결성, 버그, 속도저하 요인, 중복성 체크
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 1. 주간 조회수 데이터 확인
    console.log("📊 1. 주간 조회수 데이터 확인:");
    const channelsWithWeeklyViews = await prisma.youTubeChannel.count({
      where: {
        weeklyViewCount: {
          gt: 0,
        },
      },
    });
    const totalChannels = await prisma.youTubeChannel.count();
    console.log(`   주간 조회수가 있는 채널: ${channelsWithWeeklyViews}/${totalChannels}`);
    console.log(`   주간 조회수가 0인 채널: ${totalChannels - channelsWithWeeklyViews}\n`);

    // 2. 채널 ID 매핑 확인
    console.log("🔗 2. 채널 ID 매핑 확인:");
    const sampleChannels = await prisma.youTubeChannel.findMany({
      take: 5,
      select: {
        id: true,
        channelId: true,
        channelName: true,
      },
    });
    console.log("   샘플 채널 ID 매핑:");
    for (const ch of sampleChannels) {
      console.log(`     DB ID: ${ch.id.substring(0, 8)}... | Channel ID: ${ch.channelId} | 이름: ${ch.channelName}`);
    }
    console.log();

    // 3. 중복 채널 확인
    console.log("🔍 3. 중복 채널 확인:");
    const duplicateChannels = await prisma.$queryRaw<Array<{ channelId: string; count: bigint }>>`
      SELECT "channelId", COUNT(*) as count
      FROM youtube_channels
      GROUP BY "channelId"
      HAVING COUNT(*) > 1
    `;
    if (duplicateChannels.length > 0) {
      console.log(`   ⚠️ 중복된 채널 ID: ${duplicateChannels.length}개`);
      duplicateChannels.forEach(d => {
        console.log(`     - ${d.channelId}: ${d.count}개`);
      });
    } else {
      console.log("   ✅ 중복 채널 없음");
    }
    console.log();

    // 4. 프로필 이미지 없는 채널 확인
    console.log("🖼️ 4. 프로필 이미지 없는 채널:");
    const channelsWithoutImage = await prisma.youTubeChannel.count({
      where: {
        OR: [
          { profileImageUrl: null },
          { profileImageUrl: "" },
        ],
      },
    });
    console.log(`   프로필 이미지 없는 채널: ${channelsWithoutImage}/${totalChannels}`);
    console.log();

    // 5. 카테고리 확인
    console.log("📁 5. 카테고리 확인:");
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { channels: true },
        },
      },
    });
    console.log(`   총 카테고리 수: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`     - ${cat.name}: ${cat._count.channels}개 채널`);
    });
    console.log();

    // 6. 최근 업데이트 확인
    console.log("🕐 6. 최근 업데이트 확인:");
    const recentUpdate = await prisma.youTubeChannel.findFirst({
      orderBy: { lastUpdated: "desc" },
      select: {
        channelName: true,
        lastUpdated: true,
      },
    });
    if (recentUpdate) {
      const hoursAgo = Math.floor((Date.now() - recentUpdate.lastUpdated.getTime()) / (1000 * 60 * 60));
      console.log(`   최근 업데이트: ${recentUpdate.channelName} (${hoursAgo}시간 전)`);
    }
    console.log();

    console.log("✅ 헬스 체크 완료!\n");

  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

