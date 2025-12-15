/**
 * 동영상 크롤링 상태 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 전체 동영상 수 확인
    const totalVideos = await prisma.video.count();
    console.log(`📊 전체 동영상 수: ${totalVideos}개\n`);

    // 동영상이 있는 채널 확인
    const channelsWithVideos = await prisma.youTubeChannel.findMany({
      where: {
        videos: {
          some: {},
        },
      },
      include: {
        videos: {
          take: 1,
          orderBy: { publishedAt: "desc" },
        },
        _count: {
          select: { videos: true },
        },
      },
      take: 10,
    });

    console.log(`📺 동영상이 있는 채널: ${channelsWithVideos.length}개\n`);

    if (channelsWithVideos.length > 0) {
      console.log("채널별 동영상 수:");
      for (const channel of channelsWithVideos) {
        console.log(
          `  - ${channel.channelName}: ${channel._count.videos}개`
        );
      }
    } else {
      console.log("⚠️ 동영상이 있는 채널이 없습니다.\n");
    }

    // 동영상이 없는 채널 확인
    const channelsWithoutVideos = await prisma.youTubeChannel.findMany({
      where: {
        videos: {
          none: {},
        },
      },
      take: 5,
    });

    console.log(`\n❌ 동영상이 없는 채널: ${channelsWithoutVideos.length}개 이상`);
    if (channelsWithoutVideos.length > 0) {
      console.log("예시 채널:");
      for (const channel of channelsWithoutVideos.slice(0, 5)) {
        console.log(`  - ${channel.channelName} (${channel.channelId})`);
      }
    }

  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

