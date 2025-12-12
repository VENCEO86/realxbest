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
    }
    
    // 통계 확인
    const channelCount = await prisma.youTubeChannel.count();
    const categoryCount = await prisma.category.count();
    
    console.log(`\n📊 현재 상태:`);
    console.log(`  - 카테고리: ${categoryCount}개`);
    console.log(`  - 채널: ${channelCount}개`);
    
    console.log(`\n✅ 데이터베이스 설정 완료!\n`);
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
