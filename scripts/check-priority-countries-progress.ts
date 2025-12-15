/**
 * 우선순위 국가 수집 진행 상황 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    const priorityCountries = [
      { code: "KR", name: "한국" },
      { code: "JP", name: "일본" },
      { code: "CN", name: "중국" },
      { code: "DE", name: "독일" },
      { code: "GB", name: "영국" },
      { code: "FR", name: "프랑스" },
      { code: "BR", name: "브라질" },
      { code: "MX", name: "멕시코" },
    ];

    console.log("📊 우선순위 국가별 채널 수:\n");
    
    let totalCount = 0;
    let countriesWithData = 0;
    let countriesOver200 = 0;

    for (const country of priorityCountries) {
      const count = await prisma.youTubeChannel.count({
        where: { country: country.code },
      });
      
      totalCount += count;
      if (count > 0) countriesWithData++;
      if (count >= 200) countriesOver200++;

      const status = count >= 200 ? "✅" : count >= 100 ? "⚠️" : count > 0 ? "❌" : "  ";
      console.log(`  ${status} ${country.name.padEnd(8)} (${country.code}): ${count.toString().padStart(5)}개`);
    }

    console.log(`\n📈 요약:`);
    console.log(`  총 채널 수: ${totalCount.toLocaleString()}개`);
    console.log(`  데이터 있는 국가: ${countriesWithData}/${priorityCountries.length}개`);
    console.log(`  200개 이상 달성: ${countriesOver200}/${priorityCountries.length}개`);

    // 카테고리별 상세 확인
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    console.log(`\n📁 국가별 + 카테고리별 상세 통계:`);
    for (const country of priorityCountries) {
      const count = await prisma.youTubeChannel.count({
        where: { country: country.code },
      });
      
      if (count > 0) {
        console.log(`\n  ${country.name} (${country.code}):`);
        const channelsByCategory = await prisma.youTubeChannel.groupBy({
          by: ["categoryId"],
          where: { country: country.code },
          _count: { id: true },
        });

        for (const item of channelsByCategory) {
          const category = categories.find(c => c.id === item.categoryId);
          const categoryName = category ? category.name : "Unknown";
          const catCount = item._count.id;
          const status = catCount >= 200 ? "✅" : catCount >= 100 ? "⚠️" : "❌";
          console.log(`    ${status} ${categoryName.padEnd(15)}: ${catCount.toString().padStart(4)}개`);
        }
      }
    }

  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

