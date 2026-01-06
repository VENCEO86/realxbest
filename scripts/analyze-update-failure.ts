import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// 환경 변수 로드
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

const prisma = new PrismaClient();

async function analyzeUpdateFailure() {
  try {
    console.log("=".repeat(70));
    console.log("🔍 데이터 업데이트 실패 원인 분석");
    console.log("=".repeat(70));
    console.log("");

    // 1. 최근 데이터 추가 시간 확인
    console.log("1️⃣ 최근 데이터 추가 시간 확인");
    console.log("-".repeat(70));
    
    const recentChannels = await prisma.youTubeChannel.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        channelName: true,
        country: true,
        createdAt: true,
      },
    });

    if (recentChannels.length > 0) {
      const latestDate = recentChannels[0].createdAt;
      const now = new Date();
      const hoursAgo = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60));
      const daysAgo = Math.floor(hoursAgo / 24);

      console.log(`최근 추가된 채널: ${recentChannels[0].channelName}`);
      console.log(`추가 시간: ${latestDate.toLocaleString("ko-KR")}`);
      console.log(`경과 시간: ${hoursAgo}시간 전 (${daysAgo}일 전)`);
      
      if (daysAgo > 1) {
        console.log(`⚠️  최근 ${daysAgo}일 동안 데이터가 추가되지 않았습니다.`);
      }
    } else {
      console.log("❌ 데이터베이스에 채널이 없습니다.");
    }

    console.log("\n최근 10개 채널:");
    recentChannels.forEach((channel, index) => {
      const time = channel.createdAt.toLocaleString("ko-KR");
      console.log(`  ${index + 1}. [${(channel.country || "미지정").padEnd(5)}] ${channel.channelName.padEnd(30)} - ${time}`);
    });

    // 2. 오늘/어제 데이터 확인
    console.log("\n2️⃣ 오늘/어제 데이터 확인");
    console.log("-".repeat(70));
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const todayCount = await prisma.youTubeChannel.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const yesterdayCount = await prisma.youTubeChannel.count({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });

    console.log(`오늘 추가: ${todayCount}개`);
    console.log(`어제 추가: ${yesterdayCount}개`);

    // 3. GitHub Actions 워크플로우 파일 확인
    console.log("\n3️⃣ GitHub Actions 워크플로우 확인");
    console.log("-".repeat(70));
    
    const workflowsPath = path.join(process.cwd(), ".github", "workflows");
    if (fs.existsSync(workflowsPath)) {
      const workflowFiles = fs.readdirSync(workflowsPath).filter(f => f.endsWith(".yml") || f.endsWith(".yaml"));
      console.log(`워크플로우 파일: ${workflowFiles.length}개`);
      workflowFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
      
      if (workflowFiles.length === 0) {
        console.log("❌ GitHub Actions 워크플로우 파일이 없습니다!");
        console.log("   → 자동 수집이 실행되지 않을 수 있습니다.");
      }
    } else {
      console.log("❌ .github/workflows 디렉토리가 없습니다!");
      console.log("   → GitHub Actions가 설정되지 않았습니다.");
    }

    // 4. 데이터 수집 스크립트 확인
    console.log("\n4️⃣ 데이터 수집 스크립트 확인");
    console.log("-".repeat(70));
    
    const scriptPath = path.join(process.cwd(), "scripts", "daily-auto-collect.ts");
    if (fs.existsSync(scriptPath)) {
      const scriptContent = fs.readFileSync(scriptPath, "utf-8");
      
      // API 키 확인 로직 확인
      const hasApiKeyCheck = scriptContent.includes("YOUTUBE_API_KEYS") || scriptContent.includes("YOUTUBE_API_KEY");
      const hasDatabaseCheck = scriptContent.includes("DATABASE_URL");
      const hasErrorHandling = scriptContent.includes("try") && scriptContent.includes("catch");
      
      console.log(`스크립트 존재: ✅`);
      console.log(`API 키 확인 로직: ${hasApiKeyCheck ? "✅" : "❌"}`);
      console.log(`데이터베이스 확인 로직: ${hasDatabaseCheck ? "✅" : "❌"}`);
      console.log(`에러 처리: ${hasErrorHandling ? "✅" : "❌"}`);
      
      // 스크립트 크기 확인
      const scriptSize = scriptContent.length;
      console.log(`스크립트 크기: ${(scriptSize / 1024).toFixed(2)} KB`);
      
      if (scriptSize < 1000) {
        console.log("⚠️  스크립트가 너무 작습니다. 내용이 제대로 있는지 확인하세요.");
      }
    } else {
      console.log("❌ daily-auto-collect.ts 파일이 없습니다!");
    }

    // 5. 환경 변수 확인
    console.log("\n5️⃣ 환경 변수 확인");
    console.log("-".repeat(70));
    
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasYoutubeApiKey = !!(process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEYS);
    
    console.log(`DATABASE_URL: ${hasDatabaseUrl ? "✅ 설정됨" : "❌ 없음"}`);
    console.log(`YOUTUBE_API_KEY/KEYS: ${hasYoutubeApiKey ? "✅ 설정됨" : "❌ 없음"}`);
    
    if (hasYoutubeApiKey) {
      const apiKeys = process.env.YOUTUBE_API_KEYS?.split(",") || [process.env.YOUTUBE_API_KEY || ""];
      const validKeys = apiKeys.filter(key => key && key.startsWith("AIza"));
      console.log(`유효한 API 키 개수: ${validKeys.length}개`);
      
      if (validKeys.length === 0) {
        console.log("❌ 유효한 API 키가 없습니다!");
      }
    }

    // 6. 데이터베이스 연결 확인
    console.log("\n6️⃣ 데이터베이스 연결 확인");
    console.log("-".repeat(70));
    
    try {
      await prisma.$connect();
      console.log("✅ 데이터베이스 연결 성공");
      
      const totalChannels = await prisma.youTubeChannel.count();
      console.log(`총 채널 수: ${totalChannels.toLocaleString()}개`);
      
      if (totalChannels === 0) {
        console.log("⚠️  데이터베이스에 채널이 없습니다.");
      }
    } catch (error: any) {
      console.log(`❌ 데이터베이스 연결 실패: ${error.message}`);
    }

    // 7. 최근 업데이트된 채널 확인
    console.log("\n7️⃣ 최근 업데이트된 채널 확인");
    console.log("-".repeat(70));
    
    const recentlyUpdated = await prisma.youTubeChannel.findMany({
      orderBy: {
        lastUpdated: "desc",
      },
      take: 5,
      select: {
        channelName: true,
        country: true,
        lastUpdated: true,
        createdAt: true,
      },
    });

    if (recentlyUpdated.length > 0) {
      const latestUpdate = recentlyUpdated[0].lastUpdated;
      const now = new Date();
      const hoursSinceUpdate = Math.floor((now.getTime() - latestUpdate.getTime()) / (1000 * 60 * 60));
      
      console.log(`최근 업데이트: ${latestUpdate.toLocaleString("ko-KR")}`);
      console.log(`경과 시간: ${hoursSinceUpdate}시간 전`);
      
      if (hoursSinceUpdate > 24) {
        console.log(`⚠️  최근 24시간 동안 업데이트가 없습니다.`);
      }
    }

    // 8. 종합 분석
    console.log("\n" + "=".repeat(70));
    console.log("📊 종합 분석 결과");
    console.log("=".repeat(70));
    
    const issues: string[] = [];
    
    if (todayCount === 0 && yesterdayCount === 0) {
      issues.push("최근 2일간 데이터 추가 없음");
    }
    
    if (!fs.existsSync(workflowsPath) || (fs.existsSync(workflowsPath) && fs.readdirSync(workflowsPath).filter(f => f.endsWith(".yml") || f.endsWith(".yaml")).length === 0)) {
      issues.push("GitHub Actions 워크플로우 없음");
    }
    
    if (!hasDatabaseUrl) {
      issues.push("DATABASE_URL 환경 변수 없음");
    }
    
    if (!hasYoutubeApiKey) {
      issues.push("YOUTUBE_API_KEY 환경 변수 없음");
    }
    
    if (issues.length > 0) {
      console.log("\n❌ 발견된 문제:");
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      
      console.log("\n💡 해결 방법:");
      if (issues.includes("GitHub Actions 워크플로우 없음")) {
        console.log("  1. .github/workflows/daily-collect.yml 파일 생성 필요");
        console.log("  2. GitHub Secrets에 DATABASE_URL, YOUTUBE_API_KEYS 설정 필요");
      }
      if (issues.includes("DATABASE_URL 환경 변수 없음")) {
        console.log("  1. Render Environment에 DATABASE_URL 설정 필요");
        console.log("  2. GitHub Secrets에 DATABASE_URL 설정 필요");
      }
      if (issues.includes("YOUTUBE_API_KEY 환경 변수 없음")) {
        console.log("  1. Render Environment에 YOUTUBE_API_KEYS 설정 필요");
        console.log("  2. GitHub Secrets에 YOUTUBE_API_KEYS 설정 필요");
      }
    } else {
      console.log("\n✅ 모든 설정이 정상입니다.");
      console.log("   → 데이터 수집 스크립트가 실행되지 않았을 가능성이 높습니다.");
      console.log("   → GitHub Actions 실행 기록을 확인하세요.");
    }

    console.log("\n" + "=".repeat(70));
    
  } catch (error: any) {
    console.error("\n❌ 분석 중 오류 발생:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUpdateFailure();

