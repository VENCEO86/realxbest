import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabaseStats() {
  try {
    await prisma.$connect();
    
    // 전체 채널 수
    const totalChannels = await prisma.youTubeChannel.count();
    
    // 카테고리별 채널 수
    const channelsByCategory = await prisma.youTubeChannel.groupBy({
      by: ["categoryId"],
      _count: {
        id: true,
      },
    });
    
    // 카테고리 이름과 함께 조회
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    // 국가별 채널 수
    const channelsByCountry = await prisma.youTubeChannel.groupBy({
      by: ["country"],
      _count: {
        id: true,
      },
    });
    
    // 최소 기준값 이상의 채널 수
    const validChannels = await prisma.youTubeChannel.count({
      where: {
        subscriberCount: { gte: BigInt(1000) },
        totalViewCount: { gte: BigInt(10000) },
      },
    });
    
    console.log("\n=== 데이터베이스 통계 ===\n");
    console.log(`전체 채널 수: ${totalChannels.toLocaleString()}개`);
    console.log(`유효한 채널 수 (구독자 1천명 이상, 조회수 1만 이상): ${validChannels.toLocaleString()}개\n`);
    
    console.log("카테고리별 채널 수:");
    channelsByCategory.forEach((item) => {
      const categoryName = categoryMap.get(item.categoryId) || "알 수 없음";
      console.log(`  ${categoryName}: ${item._count.id.toLocaleString()}개`);
    });
    
    console.log("\n국가별 채널 수 (상위 10개):");
    const sortedByCountry = channelsByCountry
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 10);
    sortedByCountry.forEach((item) => {
      console.log(`  ${item.country || "미지정"}: ${item._count.id.toLocaleString()}개`);
    });
    
  } catch (error) {
    console.error("데이터베이스 연결 오류:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStats();

