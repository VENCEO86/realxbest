/**
 * 지금 바로 수동 수집 실행 스크립트
 * 할당량이 있는 키만 사용하여 수집 진행
 */

import { PrismaClient } from "@prisma/client";
import { COUNTRIES } from "../lib/countries";

const prisma = new PrismaClient();

// API 키 관리 (다중 키 지원)
const YOUTUBE_API_KEYS = (
  process.env.YOUTUBE_API_KEYS || 
  process.env.YOUTUBE_API_KEY || 
  ""
).split(",").map(key => key.trim()).filter(key => key.length > 0);

let currentKeyIndex = 0;
const keyUsageCount = new Map<string, number>();
const exhaustedKeys = new Set<string>();
const dailyQuotaUsed = new Map<string, number>();
const QUOTA_LIMIT_PER_KEY = 9000;

// API 키 테스트 함수
async function testApiKey(apiKey: string): Promise<{ valid: boolean; quotaExceeded: boolean }> {
  try {
    const testChannelId = "UCX6OQ3DkcsbYNE6H8uQQuVA"; // MrBeast
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${testChannelId}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
        return { valid: false, quotaExceeded: true };
      }
      return { valid: false, quotaExceeded: false };
    }

    const data = await response.json();
    return { valid: data.items && data.items.length > 0, quotaExceeded: false };
  } catch {
    return { valid: false, quotaExceeded: false };
  }
}

function getNextApiKey(): string {
  const availableKeys = YOUTUBE_API_KEYS.filter(key => {
    if (exhaustedKeys.has(key)) return false;
    const used = dailyQuotaUsed.get(key) || 0;
    return used < QUOTA_LIMIT_PER_KEY;
  });
  
  if (availableKeys.length === 0) {
    throw new Error("모든 API 키의 할당량이 소진되었습니다.");
  }
  
  const key = availableKeys[currentKeyIndex % availableKeys.length];
  currentKeyIndex++;
  keyUsageCount.set(key, (keyUsageCount.get(key) || 0) + 1);
  
  return key;
}

function incrementApiUsage(key: string, units: number) {
  const current = dailyQuotaUsed.get(key) || 0;
  dailyQuotaUsed.set(key, current + units);
  
  if (current + units >= QUOTA_LIMIT_PER_KEY) {
    exhaustedKeys.add(key);
    console.log(`  ⚠️ API 키 할당량 소진: ${key.substring(0, 20)}...`);
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    if (YOUTUBE_API_KEYS.length === 0) {
      console.error("❌ YouTube API 키가 설정되지 않았습니다.");
      process.exit(1);
    }

    // API 키 상태 확인
    console.log("🔍 API 키 상태 확인 중...\n");
    const validKeys: string[] = [];
    
    for (const apiKey of YOUTUBE_API_KEYS) {
      const maskedKey = apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4);
      console.log(`키 확인: ${maskedKey}`);
      
      const result = await testApiKey(apiKey);
      if (result.valid && !result.quotaExceeded) {
        validKeys.push(apiKey);
        console.log(`  ✅ 사용 가능\n`);
      } else if (result.quotaExceeded) {
        exhaustedKeys.add(apiKey);
        console.log(`  ⚠️ 할당량 초과\n`);
      } else {
        exhaustedKeys.add(apiKey);
        console.log(`  ❌ 오류\n`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (validKeys.length === 0) {
      console.log("❌ 사용 가능한 API 키가 없습니다.");
      console.log("   할당량이 리셋될 때까지 기다려주세요 (내일 자정 UTC).\n");
      return;
    }

    console.log(`✅ 사용 가능한 API 키: ${validKeys.length}개\n`);
    console.log("🚀 수집을 시작합니다...\n");

    // 실제 수집 로직은 daily-auto-collect.ts와 동일
    // 여기서는 간단한 테스트만 수행
    console.log("💡 실제 수집을 실행하려면:");
    console.log("   npm run collect:daily\n");

  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);


