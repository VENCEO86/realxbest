/**
 * 데이터베이스 자동 설정 스크립트
 * 카테고리 초기화 및 기본 데이터 설정
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "엔터테인먼트", nameEn: "Entertainment" },
  { name: "음악", nameEn: "Music" },
  { name: "교육", nameEn: "Education" },
  { name: "게임", nameEn: "Gaming" },
  { name: "스포츠", nameEn: "Sports" },
  { name: "뉴스/정치", nameEn: "News/Politics" },
  { name: "인물/블로그", nameEn: "People/Blog" },
  { name: "노하우/스타일", nameEn: "Howto/Style" },
  { name: "기타", nameEn: "Other" },
];

async function main() {
  console.log("🚀 데이터베이스 자동 설정 시작...\n");
  
  try {
    await prisma.$connect();
    console.log("✅ 데이터베이스 연결 성공\n");
    
    // 카테고리 초기화
    console.log("📋 카테고리 설정 중...");
    for (const category of CATEGORIES) {
      try {
        const existing = await prisma.category.findUnique({
          where: { name: category.name },
        });
        
        if (!existing) {
          await prisma.category.create({
            data: {
              name: category.name,
              nameEn: category.nameEn,
            },
          });
          console.log(`  ✅ ${category.name} 생성`);
        } else {
          console.log(`  ⏭️  ${category.name} 이미 존재`);
        }
      } catch (error: any) {
        // 개별 카테고리 생성 실패는 무시하고 계속 진행
        console.error(`  ⚠️  ${category.name} 생성 실패: ${error.message}`);
        // 테이블이 없거나 스키마 문제일 수 있으므로 계속 진행
      }
    }
    
    // 통계 확인
    try {
      const channelCount = await prisma.youTubeChannel.count();
      const categoryCount = await prisma.category.count();
      
      console.log(`\n📊 현재 상태:`);
      console.log(`  - 카테고리: ${categoryCount}개`);
      console.log(`  - 채널: ${channelCount}개`);
    } catch (error: any) {
      console.log(`\n⚠️  통계 조회 실패 (테이블이 없을 수 있음): ${error.message}`);
    }
    
    console.log(`\n✅ 데이터베이스 설정 완료!\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    console.error("  에러 코드:", error.code);
    console.error("  에러 메시지:", error.message);
    
    // P1017: 데이터베이스 연결 실패
    if (error.code === 'P1017') {
      console.error("\n💡 해결 방법:");
      console.error("  - DATABASE_URL이 올바른지 확인");
      console.error("  - 데이터베이스 서버가 실행 중인지 확인");
    }
    
    // P1001: 데이터베이스 연결 불가
    if (error.code === 'P1001') {
      console.error("\n💡 해결 방법:");
      console.error("  - 데이터베이스 서버에 연결할 수 없습니다");
      console.error("  - 네트워크 연결 및 방화벽 설정 확인");
    }
    
    // 스키마 관련 오류
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      console.error("\n💡 해결 방법:");
      console.error("  - Prisma 스키마를 데이터베이스에 적용하세요: npx prisma db push");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
