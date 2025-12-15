/**
 * 이탈리아 채널 수 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 전체 이탈리아 채널 수
    const totalItaly = await prisma.youTubeChannel.count({
      where: { country: "IT" },
    });
    console.log(`📊 전체 이탈리아 채널 수: ${totalItaly}개`);

    // 프로필 이미지 있는 이탈리아 채널 수
    const withProfile = await prisma.youTubeChannel.count({
      where: {
        country: "IT",
        profileImageUrl: { not: null },
      },
    });
    console.log(`📊 프로필 이미지 있는 이탈리아 채널: ${withProfile}개`);

    // 카테고리별 이탈리아 채널 수
    const categories = await prisma.category.findMany();
    console.log("\n📊 카테고리별 이탈리아 채널 수:");
    for (const category of categories) {
      const count = await prisma.youTubeChannel.count({
        where: {
          country: "IT",
          categoryId: category.id,
        },
      });
      console.log(`  - ${category.name}: ${count}개`);
    }

    // 최소 기준 충족 채널 수 (100명 이상 구독자, 1000 이상 조회수)
    const qualified = await prisma.youTubeChannel.count({
      where: {
        country: "IT",
        subscriberCount: { gte: BigInt(100) },
        totalViewCount: { gte: BigInt(1000) },
        profileImageUrl: { not: null },
      },
    });
    console.log(`\n📊 최소 기준 충족 이탈리아 채널: ${qualified}개 (구독자 100명 이상, 조회수 1000 이상, 프로필 이미지 있음)`);

    // 최근 업데이트된 채널 수
    const recent = await prisma.youTubeChannel.count({
      where: {
        country: "IT",
        lastUpdated: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
        },
      },
    });
    console.log(`📊 최근 7일 내 업데이트된 이탈리아 채널: ${recent}개`);

  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

