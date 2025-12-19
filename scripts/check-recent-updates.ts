import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 최근 데이터 업데이트 현황\n');
  console.log('='.repeat(50));

  // 오늘 날짜 (한국시간 기준 새벽 0시)
  const now = new Date();
  const koreaOffset = 9 * 60; // UTC+9
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const koreaNow = new Date(utcNow + (koreaOffset * 60 * 1000));
  
  const today = new Date(koreaNow);
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(yesterday);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

  console.log(`\n현재 시간: ${koreaNow.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`오늘 기준: ${today.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`어제 기준: ${yesterday.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`이틀 전 기준: ${twoDaysAgo.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`);

  // 오늘 추가된 채널
  const todayCreated = await prisma.youTubeChannel.count({
    where: {
      createdAt: {
        gte: today
      }
    }
  });

  // 어제 추가된 채널
  const yesterdayCreated = await prisma.youTubeChannel.count({
    where: {
      createdAt: {
        gte: yesterday,
        lt: today
      }
    }
  });

  // 이틀 전 추가된 채널
  const twoDaysAgoCreated = await prisma.youTubeChannel.count({
    where: {
      createdAt: {
        gte: twoDaysAgo,
        lt: yesterday
      }
    }
  });

  // 오늘 업데이트된 채널 (lastUpdated 기준)
  const todayUpdated = await prisma.youTubeChannel.count({
    where: {
      lastUpdated: {
        gte: today
      }
    }
  });

  // 어제 업데이트된 채널
  const yesterdayUpdated = await prisma.youTubeChannel.count({
    where: {
      lastUpdated: {
        gte: yesterday,
        lt: today
      }
    }
  });

  console.log('📈 채널 추가 현황:');
  console.log(`   오늘 추가: ${todayCreated}개`);
  console.log(`   어제 추가: ${yesterdayCreated}개`);
  console.log(`   이틀 전 추가: ${twoDaysAgoCreated}개`);

  console.log('\n🔄 채널 업데이트 현황:');
  console.log(`   오늘 업데이트: ${todayUpdated}개`);
  console.log(`   어제 업데이트: ${yesterdayUpdated}개`);

  // 최근 추가된 채널 10개
  const recentChannels = await prisma.youTubeChannel.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      channelName: true,
      country: true,
      createdAt: true,
      lastUpdated: true,
      subscriberCount: true
    }
  });

  console.log('\n📺 최근 추가된 채널 (10개):');
  recentChannels.forEach((c, i) => {
    const created = new Date(c.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const updated = new Date(c.lastUpdated).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const subs = Number(c.subscriberCount).toLocaleString('ko-KR');
    console.log(`   ${i + 1}. ${c.channelName} (${c.country || 'N/A'})`);
    console.log(`      구독자: ${subs}명 | 생성: ${created} | 수정: ${updated}`);
  });

  // 국가별 최근 업데이트 현황
  const countryStats = await prisma.youTubeChannel.groupBy({
    by: ['country'],
    where: {
      createdAt: {
        gte: twoDaysAgo
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    }
  });

  console.log('\n🌍 국가별 최근 2일간 추가 현황:');
  countryStats.forEach((stat) => {
    console.log(`   ${stat.country || 'N/A'}: ${stat._count.id}개`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);

