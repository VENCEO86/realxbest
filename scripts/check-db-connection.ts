// DB 연결 확인 스크립트
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  console.log('🔍 데이터베이스 연결 확인 중...\n');

  try {
    // 1. 데이터베이스 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 2. 스키마 모델 확인
    console.log('📋 스키마 모델 확인 중...\n');
    
    // 각 모델의 레코드 수 확인
    const channelCount = await prisma.youTubeChannel.count();
    const videoCount = await prisma.video.count();
    const categoryCount = await prisma.category.count();
    const adCount = await prisma.ad.count();
    const pixelCount = await prisma.pixel.count();

    console.log('📊 데이터베이스 통계:');
    console.log(`  - YouTubeChannel: ${channelCount}개`);
    console.log(`  - Video: ${videoCount}개`);
    console.log(`  - Category: ${categoryCount}개`);
    console.log(`  - Ad: ${adCount}개`);
    console.log(`  - Pixel: ${pixelCount}개\n`);

    // 3. 샘플 데이터 조회 테스트
    console.log('🧪 샘플 데이터 조회 테스트...\n');
    const sampleChannel = await prisma.youTubeChannel.findFirst({
      take: 1,
      select: {
        id: true,
        channelId: true,
        channelName: true,
        subscriberCount: true,
      },
    });

    if (sampleChannel) {
      console.log('✅ 샘플 데이터 조회 성공:');
      console.log(`  - Channel ID: ${sampleChannel.channelId}`);
      console.log(`  - Channel Name: ${sampleChannel.channelName}`);
      console.log(`  - Subscribers: ${sampleChannel.subscriberCount}\n`);
    } else {
      console.log('⚠️  데이터베이스에 채널 데이터가 없습니다.\n');
    }

    // 4. 관계 확인 (Category와의 관계)
    console.log('🔗 관계 확인 중...\n');
    const channelWithCategory = await prisma.youTubeChannel.findFirst({
      include: {
        category: true,
      },
    });

    if (channelWithCategory) {
      console.log('✅ 관계 조회 성공:');
      console.log(`  - Channel: ${channelWithCategory.channelName}`);
      console.log(`  - Category: ${channelWithCategory.category?.name || 'N/A'}\n`);
    }

    console.log('🎉 데이터베이스 연결 및 구조 확인 완료!\n');
    console.log('✅ 모든 검사 통과\n');

  } catch (error: any) {
    console.error('❌ 데이터베이스 연결 실패:\n');
    
    if (error.errorCode === 'P1012') {
      console.error('⚠️  DATABASE_URL 환경 변수가 설정되지 않았습니다.');
      console.error('   .env.local 파일에 DATABASE_URL을 설정하세요.');
      console.error('   예: DATABASE_URL="postgresql://user:password@localhost:5432/korxyoutube?schema=public"');
    } else {
      console.error(error);
    }
    
    console.error('\n💡 해결 방법:');
    console.error('   1. .env.local 파일에 DATABASE_URL 설정');
    console.error('   2. 또는 npm run setup-env 실행');
    console.error('\n⚠️  데이터베이스 연결 없이도 애플리케이션은 Mock 데이터로 작동합니다.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseConnection();

