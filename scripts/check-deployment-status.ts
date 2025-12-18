import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 총 채널 수 확인
    const total = await prisma.youTubeChannel.count();
    console.log(`📊 총 채널 수: ${total.toLocaleString()}개\n`);

    // 국가별 상위 10개
    const byCountry = await prisma.youTubeChannel.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });
    console.log("🌍 국가별 상위 10개:");
    byCountry.forEach(c => {
      console.log(`  ${c.country || 'NULL'}: ${c._count.toLocaleString()}개`);
    });
    console.log();

    // 카테고리별 채널 수
    const byCategory = await prisma.youTubeChannel.groupBy({
      by: ['categoryId'],
      _count: true,
      orderBy: { _count: { categoryId: 'desc' } },
    });
    console.log("📁 카테고리별 채널 수:");
    for (const cat of byCategory) {
      const category = await prisma.category.findUnique({
        where: { id: cat.categoryId },
        select: { name: true },
      });
      console.log(`  ${category?.name || cat.categoryId}: ${cat._count.toLocaleString()}개`);
    }
    console.log();

    // 최근 업데이트된 채널
    const recent = await prisma.youTubeChannel.findMany({
      orderBy: { lastUpdated: 'desc' },
      take: 5,
      select: {
        channelName: true,
        lastUpdated: true,
        subscriberCount: true,
      },
    });
    console.log("🕐 최근 업데이트된 채널 (상위 5개):");
    recent.forEach(ch => {
      const hoursAgo = Math.floor((Date.now() - ch.lastUpdated.getTime()) / (1000 * 60 * 60));
      console.log(`  ${ch.channelName}: ${hoursAgo}시간 전 (구독자: ${Number(ch.subscriberCount).toLocaleString()}명)`);
    });
    console.log();

    // 필터링 조건 확인 (최소 구독자 100명 이상)
    const filteredCount = await prisma.youTubeChannel.count({
      where: {
        subscriberCount: { gte: BigInt(100) },
        totalViewCount: { gte: BigInt(1000) },
      },
    });
    console.log(`🔍 필터링 조건 (구독자 100명 이상, 조회수 1,000 이상): ${filteredCount.toLocaleString()}개\n`);

  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);


