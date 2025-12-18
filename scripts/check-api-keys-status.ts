/**
 * YouTube API 키 상태 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 환경 변수에서 API 키 가져오기
const YOUTUBE_API_KEYS_STR = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_API_KEYS = YOUTUBE_API_KEYS_STR.split(',').map(key => key.trim()).filter(key => key.length > 0);

async function testApiKey(apiKey: string, index: number): Promise<{ valid: boolean; quotaExceeded: boolean; error?: string }> {
  try {
    // 간단한 테스트: 채널 정보 조회 (1 unit 소모)
    const testChannelId = "UCX6OQ3DkcsbYNE6H8uQQuVA"; // MrBeast
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${testChannelId}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        // 할당량 초과 또는 API 키 비활성화
        if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          return { valid: false, quotaExceeded: true, error: "할당량 초과" };
        } else if (errorData.error?.errors?.[0]?.reason === 'keyInvalid') {
          return { valid: false, quotaExceeded: false, error: "API 키가 유효하지 않음" };
        } else {
          return { valid: false, quotaExceeded: false, error: `403 오류: ${errorData.error?.message || '알 수 없는 오류'}` };
        }
      } else {
        return { valid: false, quotaExceeded: false, error: `HTTP ${response.status}` };
      }
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return { valid: true, quotaExceeded: false };
    } else {
      return { valid: false, quotaExceeded: false, error: "응답 데이터 없음" };
    }
  } catch (error: any) {
    return { valid: false, quotaExceeded: false, error: error.message };
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");

    // 총 채널 수 확인
    const total = await prisma.youTubeChannel.count();
    console.log(`📊 총 채널 수: ${total.toLocaleString()}개\n`);

    // API 키 개수 확인
    console.log(`🔑 설정된 API 키 개수: ${YOUTUBE_API_KEYS.length}개\n`);
    
    if (YOUTUBE_API_KEYS.length === 0) {
      console.log("❌ API 키가 설정되지 않았습니다!");
      console.log("   환경 변수 YOUTUBE_API_KEYS를 확인하세요.\n");
      return;
    }

    // 각 API 키 테스트
    console.log("🔍 API 키 상태 확인 중...\n");
    const results = [];
    
    for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
      const apiKey = YOUTUBE_API_KEYS[i];
      const maskedKey = apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4);
      
      console.log(`키 ${i + 1}/${YOUTUBE_API_KEYS.length}: ${maskedKey}`);
      
      const result = await testApiKey(apiKey, i);
      results.push({ index: i + 1, key: maskedKey, ...result });
      
      if (result.valid) {
        console.log(`  ✅ 정상 작동\n`);
      } else if (result.quotaExceeded) {
        console.log(`  ⚠️ 할당량 초과\n`);
      } else {
        console.log(`  ❌ 오류: ${result.error}\n`);
      }
      
      // API 호출 간 딜레이 (Rate limiting 방지)
      if (i < YOUTUBE_API_KEYS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 요약
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 API 키 상태 요약:\n");
    
    const validKeys = results.filter(r => r.valid).length;
    const quotaExceededKeys = results.filter(r => r.quotaExceeded).length;
    const invalidKeys = results.filter(r => !r.valid && !r.quotaExceeded).length;
    
    console.log(`✅ 정상 작동: ${validKeys}개`);
    console.log(`⚠️ 할당량 초과: ${quotaExceededKeys}개`);
    console.log(`❌ 오류: ${invalidKeys}개\n`);

    // YouTube API 할당량 계산
    console.log("📊 YouTube API 할당량 계산:\n");
    const dailyQuotaPerKey = 10000; // 기본 할당량
    const totalDailyQuota = dailyQuotaPerKey * validKeys;
    
    console.log(`키당 일일 할당량: ${dailyQuotaPerKey.toLocaleString()} units`);
    console.log(`사용 가능한 총 할당량: ${totalDailyQuota.toLocaleString()} units (${validKeys}개 키 기준)\n`);
    
    // 채널 수집에 필요한 할당량 계산
    console.log("📈 채널 수집에 필요한 할당량:\n");
    console.log("  - 채널 검색: 100 units/요청");
    console.log("  - 채널 상세 정보: 1 unit/채널");
    console.log("  - 동영상 검색: 100 units/요청\n");
    
    // 예상 수집 가능 채널 수
    // 검색 1회당 평균 50개 채널 발견, 상세 정보 조회 50 units
    // 총 150 units로 50개 채널 수집 가능
    const channelsPer150Units = 50;
    const estimatedChannels = Math.floor((totalDailyQuota / 150) * channelsPer150Units);
    
    console.log(`예상 수집 가능 채널 수: 약 ${estimatedChannels.toLocaleString()}개/일`);
    console.log(`현재 DB 채널 수: ${total.toLocaleString()}개\n`);
    
    if (estimatedChannels > total) {
      console.log("✅ 할당량으로 충분히 수집 가능합니다!\n");
    } else {
      console.log("⚠️ 할당량이 부족할 수 있습니다.\n");
    }

    // 권장 사항
    if (quotaExceededKeys > 0 || invalidKeys > 0) {
      console.log("💡 권장 사항:\n");
      if (quotaExceededKeys > 0) {
        console.log("  - 할당량이 초과된 키는 내일 자정(UTC)에 리셋됩니다.");
      }
      if (invalidKeys > 0) {
        console.log("  - 오류가 있는 API 키를 확인하고 수정하세요.");
      }
      console.log();
    }

  } catch (error: any) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);


