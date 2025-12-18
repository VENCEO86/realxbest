// 국가별/유튜버별 수집 현황 조회 스크립트
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

// 환경 변수 로드
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function checkCountryStats() {
  try {
    await prisma.$connect();
    
    console.log('\n📊 국가별 채널 수집 현황\n');
    console.log('='.repeat(50));
    
    // 국가별 채널 수 (null 제외)
    const channelsByCountry = await prisma.youTubeChannel.groupBy({
      by: ['country'],
      _count: {
        id: true,
      },
      where: {
        country: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });
    
    // 국가별 채널 수 출력
    channelsByCountry.forEach((item, index) => {
      console.log(`${String(index + 1).padStart(3)}. ${item.country || '미지정'}: ${item._count.id.toLocaleString()}개`);
    });
    
    // null인 채널 수
    const nullCountryCount = await prisma.youTubeChannel.count({
      where: {
        country: null,
      },
    });
    
    if (nullCountryCount > 0) {
      console.log(`\n   미지정 국가: ${nullCountryCount.toLocaleString()}개`);
    }
    
    // 전체 채널 수
    const totalChannels = await prisma.youTubeChannel.count();
    console.log('\n' + '='.repeat(50));
    console.log(`총 채널 수: ${totalChannels.toLocaleString()}개\n`);
    
    // 국가별 상위 유튜버 (구독자 수 기준)
    console.log('\n📺 국가별 상위 유튜버 (구독자 수 기준)\n');
    console.log('='.repeat(50));
    
    // 국가별로 상위 3명씩 조회
    const topCountries = channelsByCountry.slice(0, 10).map(item => item.country).filter(Boolean) as string[];
    
    for (const country of topCountries) {
      const topChannels = await prisma.youTubeChannel.findMany({
        where: {
          country: country,
        },
        select: {
          channelName: true,
          subscriberCount: true,
          totalViewCount: true,
        },
        orderBy: {
          subscriberCount: 'desc',
        },
        take: 3,
      });
      
      if (topChannels.length > 0) {
        console.log(`\n${country}:`);
        topChannels.forEach((channel, idx) => {
          const subCount = Number(channel.subscriberCount);
          const viewCount = Number(channel.totalViewCount);
          console.log(`  ${idx + 1}. ${channel.channelName}`);
          console.log(`     구독자: ${subCount.toLocaleString()}명 | 조회수: ${viewCount.toLocaleString()}회`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCountryStats();

