// 최근 24시간 내 신규 추가 데이터 현황 확인
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentData() {
  try {
    console.log('🔍 최근 24시간 내 신규 데이터 현황 확인 중...\n');

    // 현재 시간
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`📅 조회 기간: ${oneDayAgo.toLocaleString('ko-KR')} ~ ${now.toLocaleString('ko-KR')}\n`);

    // 1. 전체 채널 수
    const totalChannels = await prisma.youTubeChannel.count();
    console.log(`📊 전체 채널 수: ${totalChannels.toLocaleString()}개\n`);

    // 2. 최근 24시간 내 추가된 채널 수
    const recentChannels = await prisma.youTubeChannel.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });
    console.log(`🆕 최근 24시간 내 신규 채널: ${recentChannels.toLocaleString()}개\n`);

    // 3. 최근 24시간 내 업데이트된 채널 수
    const updatedChannels = await prisma.youTubeChannel.count({
      where: {
        lastUpdated: {
          gte: oneDayAgo,
        },
      },
    });
    console.log(`🔄 최근 24시간 내 업데이트된 채널: ${updatedChannels.toLocaleString()}개\n`);

    // 4. 국가별 신규 채널 현황
    console.log('🌍 국가별 신규 채널 현황 (최근 24시간):');
    const recentByCountry = await prisma.youTubeChannel.groupBy({
      by: ['country'],
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    for (const item of recentByCountry.slice(0, 20)) {
      const countryName = item.country || '미지정';
      console.log(`   ${countryName}: ${item._count.id.toLocaleString()}개`);
    }
    console.log('');

    // 5. 카테고리별 신규 채널 현황
    console.log('📁 카테고리별 신규 채널 현황 (최근 24시간):');
    const recentByCategory = await prisma.youTubeChannel.groupBy({
      by: ['categoryId'],
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // 카테고리 이름 가져오기
    for (const item of recentByCategory) {
      const category = await prisma.category.findUnique({
        where: { id: item.categoryId },
        select: { name: true },
      });
      const categoryName = category?.name || '미지정';
      console.log(`   ${categoryName}: ${item._count.id.toLocaleString()}개`);
    }
    console.log('');

    // 6. 국가별 전체 채널 수 (비교용)
    console.log('🌍 국가별 전체 채널 수 (상위 10개):');
    const totalByCountry = await prisma.youTubeChannel.groupBy({
      by: ['country'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    for (const item of totalByCountry) {
      const countryName = item.country || '미지정';
      const recentCount = await prisma.youTubeChannel.count({
        where: {
          country: item.country,
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });
      const percentage = totalByCountry.length > 0 
        ? ((recentCount / item._count.id) * 100).toFixed(1)
        : '0.0';
      console.log(`   ${countryName}: 전체 ${item._count.id.toLocaleString()}개 (신규 ${recentCount.toLocaleString()}개, ${percentage}%)`);
    }
    console.log('');

    // 7. 최근 추가된 채널 샘플 (상위 10개)
    console.log('📋 최근 추가된 채널 샘플 (상위 10개):');
    const recentSamples = await prisma.youTubeChannel.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        channelName: true,
        country: true,
        subscriberCount: true,
        createdAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const channel of recentSamples) {
      const countryName = channel.country || '미지정';
      const categoryName = channel.category?.name || '미지정';
      const subscribers = Number(channel.subscriberCount).toLocaleString();
      const createdAt = channel.createdAt.toLocaleString('ko-KR');
      console.log(`   - ${channel.channelName} (${countryName}, ${categoryName})`);
      console.log(`     구독자: ${subscribers}명 | 추가일: ${createdAt}`);
    }
    console.log('');

    // 8. 요약
    console.log('📊 요약:');
    console.log(`   - 전체 채널: ${totalChannels.toLocaleString()}개`);
    console.log(`   - 신규 채널 (24시간): ${recentChannels.toLocaleString()}개`);
    console.log(`   - 업데이트된 채널 (24시간): ${updatedChannels.toLocaleString()}개`);
    const growthRate = totalChannels > 0 
      ? ((recentChannels / totalChannels) * 100).toFixed(2)
      : '0.00';
    console.log(`   - 성장률: ${growthRate}%\n`);

    console.log('✅ 데이터 현황 확인 완료!\n');

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    if (error.code === 'P1001') {
      console.error('   데이터베이스 연결 실패. DATABASE_URL을 확인하세요.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentData();

