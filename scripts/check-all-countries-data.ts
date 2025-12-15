/**
 * 전체 국가 및 카테고리별 데이터 현황 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "../lib/countries";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 전체 카테고리 확인
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    console.log(`📁 총 카테고리 수: ${categories.length}개\n`);
    categories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.nameEn})`);
    });
    console.log("");

    // 전체 국가 목록
    console.log(`🌍 총 국가 수: ${COUNTRIES.length}개\n`);
    console.log("전체 국가 목록:");
    COUNTRIES.forEach((country, index) => {
      console.log(`  ${index + 1}. ${country.label} (${country.value})`);
    });
    console.log("");

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

    console.log("📊 국가별 채널 수 (데이터 있는 국가만):");
    const countryDataMap = new Map<string, number>();
    channelsByCountry.forEach((item) => {
      const countryCode = item.country || "Unknown";
      countryDataMap.set(countryCode, item._count.id);
    });

    // COUNTRIES 순서대로 정렬하여 표시
    const sortedCountries = COUNTRIES.map((country) => {
      const count = countryDataMap.get(country.value) || 0;
      return {
        ...country,
        count,
      };
    }).sort((a, b) => b.count - a.count);

    console.log("\n국가별 채널 수 (많은 순서대로):");
    sortedCountries.forEach((country) => {
      const status =
        country.count >= 200
          ? "✅"
          : country.count >= 100
          ? "⚠️"
          : country.count > 0
          ? "❌"
          : "  ";
      console.log(
        `  ${status} ${country.label.padEnd(20)} (${country.value.padEnd(3)}): ${country.count.toString().padStart(5)}개`
      );
    });

    // 국가별 + 카테고리별 상세 통계
    console.log("\n\n📊 국가별 + 카테고리별 상세 통계:");
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

    const categoryMap = new Map(
      categories.map((c) => [c.id, c.name])
    );

    const countryCategoryMap = new Map<string, Map<string, number>>();
    channelsByCountryCategory.forEach((item) => {
      const countryCode = item.country || "Unknown";
      if (!countryCategoryMap.has(countryCode)) {
        countryCategoryMap.set(countryCode, new Map());
      }
      const categoryName = categoryMap.get(item.categoryId) || "Unknown";
      countryCategoryMap.get(countryCode)!.set(categoryName, item._count.id);
    });

    // 데이터가 있는 국가만 표시
    const countriesWithData = Array.from(countryCategoryMap.keys()).sort();
    countriesWithData.forEach((countryCode) => {
      const country = COUNTRIES.find((c) => c.value === countryCode);
      const countryName = country ? country.label : countryCode;
      console.log(`\n  ${countryName} (${countryCode}):`);
      const categoryData = countryCategoryMap.get(countryCode)!;
      const sortedCategories = Array.from(categoryData.entries()).sort(
        (a, b) => b[1] - a[1]
      );
      sortedCategories.forEach(([categoryName, count]) => {
        const status =
          count >= 200 ? "✅" : count >= 100 ? "⚠️" : count > 0 ? "❌" : "  ";
        console.log(`    ${status} ${categoryName.padEnd(15)}: ${count.toString().padStart(4)}개`);
      });
    });

    // 요약 통계
    const totalChannels = await prisma.youTubeChannel.count();
    const countriesWithDataCount = countriesWithData.length;
    const countriesWithoutData = COUNTRIES.length - countriesWithDataCount;

    console.log("\n\n========================================");
    console.log("📊 전체 통계 요약");
    console.log("========================================");
    console.log(`전체 채널 수: ${totalChannels.toLocaleString()}개`);
    console.log(`전체 국가 수: ${COUNTRIES.length}개`);
    console.log(`데이터 있는 국가: ${countriesWithDataCount}개`);
    console.log(`데이터 없는 국가: ${countriesWithoutData}개`);
    console.log(`전체 카테고리 수: ${categories.length}개`);
    console.log(`평균 국가당 채널 수: ${Math.round(totalChannels / countriesWithDataCount)}개`);
    console.log("");

    // 목표 달성 현황
    const target200 = sortedCountries.filter((c) => c.count >= 200).length;
    const target100 = sortedCountries.filter((c) => c.count >= 100).length;
    const target50 = sortedCountries.filter((c) => c.count >= 50).length;

    console.log("목표 달성 현황:");
    console.log(`  ✅ 200개 이상: ${target200}개 국가`);
    console.log(`  ⚠️ 100개 이상: ${target100}개 국가`);
    console.log(`  ❌ 50개 이상: ${target50}개 국가`);
    console.log(`  ❌ 데이터 없음: ${countriesWithoutData}개 국가`);

  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

