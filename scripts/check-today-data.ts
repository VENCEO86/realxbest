import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// 환경 변수 로드 (로컬 .env.local 파일에서)
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, "utf-8");
      envFile.split("\n").forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          const [key, ...valueParts] = trimmedLine.split("=");
          if (key && valueParts.length > 0) {
            const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = value;
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn("⚠️  .env.local 파일을 읽을 수 없습니다:", error);
  }
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  console.error("   .env.local 파일에 DATABASE_URL을 설정하거나,");
  console.error("   PowerShell에서 다음 명령어를 실행하세요:");
  console.error("   $env:DATABASE_URL=\"postgresql://...\"");
  process.exit(1);
}

const prisma = new PrismaClient();

async function checkTodayData() {
  try {
    console.log("🔍 오늘 새벽 데이터 확인 중...\n");
    
    // 오늘 날짜 (한국 시간 기준)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 오늘 새벽 (00:00 ~ 현재)에 추가된 채널
    const todayChannels = await prisma.youTubeChannel.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      select: {
        id: true,
        channelName: true,
        country: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 어제 새벽 (00:00 ~ 23:59)에 추가된 채널
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayChannels = await prisma.youTubeChannel.findMany({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
      select: {
        id: true,
        channelName: true,
        country: true,
        createdAt: true,
      },
    });

    // 국가별 집계
    const todayByCountry = new Map<string, number>();
    const yesterdayByCountry = new Map<string, number>();

    todayChannels.forEach((channel) => {
      const country = channel.country || "미지정";
      todayByCountry.set(country, (todayByCountry.get(country) || 0) + 1);
    });

    yesterdayChannels.forEach((channel) => {
      const country = channel.country || "미지정";
      yesterdayByCountry.set(country, (yesterdayByCountry.get(country) || 0) + 1);
    });

    // 전체 통계
    const totalToday = todayChannels.length;
    const totalYesterday = yesterdayChannels.length;

    console.log("=".repeat(70));
    console.log("📊 오늘 새벽 데이터 추가 현황");
    console.log("=".repeat(70));
    console.log(`\n📅 오늘 (${today.toLocaleDateString("ko-KR")}): ${totalToday}개 추가`);
    console.log(`📅 어제 (${yesterday.toLocaleDateString("ko-KR")}): ${totalYesterday}개 추가\n`);

    if (totalToday > 0) {
      console.log("🌍 국가별 추가 현황 (오늘):");
      console.log("-".repeat(70));
      
      // 국가별로 정렬 (많은 순서대로)
      const sortedToday = Array.from(todayByCountry.entries()).sort(
        (a, b) => b[1] - a[1]
      );

      sortedToday.forEach(([country, count]) => {
        const percentage = ((count / totalToday) * 100).toFixed(1);
        console.log(`  ${country.padEnd(10)} : ${count.toString().padStart(5)}개 (${percentage}%)`);
      });

      console.log("\n" + "=".repeat(70));
      console.log("📋 상세 정보 (최근 20개):");
      console.log("=".repeat(70));
      
      todayChannels.slice(0, 20).forEach((channel, index) => {
        const time = channel.createdAt.toLocaleString("ko-KR");
        console.log(
          `${(index + 1).toString().padStart(3)}. [${(channel.country || "미지정").padEnd(5)}] ${channel.channelName.padEnd(30)} - ${time}`
        );
      });

      if (totalToday > 20) {
        console.log(`\n... 외 ${totalToday - 20}개 더 있음`);
      }
    } else {
      console.log("⚠️  오늘 새벽에 추가된 데이터가 없습니다.");
    }

    // 어제 데이터도 표시
    if (totalYesterday > 0) {
      console.log("\n" + "=".repeat(70));
      console.log("🌍 국가별 추가 현황 (어제):");
      console.log("-".repeat(70));
      
      const sortedYesterday = Array.from(yesterdayByCountry.entries()).sort(
        (a, b) => b[1] - a[1]
      );

      sortedYesterday.forEach(([country, count]) => {
        const percentage = ((count / totalYesterday) * 100).toFixed(1);
        console.log(`  ${country.padEnd(10)} : ${count.toString().padStart(5)}개 (${percentage}%)`);
      });
    }

    // 전체 통계
    const allChannels = await prisma.youTubeChannel.count();
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

    console.log("\n" + "=".repeat(70));
    console.log("📊 전체 통계");
    console.log("=".repeat(70));
    console.log(`\n총 채널 수: ${allChannels.toLocaleString()}개\n`);
    console.log("국가별 전체 채널 수 (상위 20개):");
    console.log("-".repeat(70));
    
    channelsByCountry.slice(0, 20).forEach((item, index) => {
      const country = item.country || "미지정";
      const count = item._count.id;
      const percentage = ((count / allChannels) * 100).toFixed(1);
      console.log(
        `${(index + 1).toString().padStart(2)}. ${country.padEnd(10)} : ${count.toString().padStart(6)}개 (${percentage}%)`
      );
    });

    console.log("\n" + "=".repeat(70));
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayData();

