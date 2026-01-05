// 현재 데이터 현황 확인 스크립트
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function checkCurrentData() {
  try {
    await prisma.$connect();
    
    console.log('\n📊 현재 데이터 현황 확인\n');
    console.log('='.repeat(70));
    
    // 전체 채널 수
    const totalChannels = await prisma.youTubeChannel.count();
    console.log(`\n총 채널 수: ${totalChannels.toLocaleString()}개`);
    
    // 필터링 후 채널 수 (공식 채널 제외)
    const officialKeywords = [
      "youtube movies", "youtube music", "youtube kids", "youtube gaming",
      "youtube tv", "youtube originals", "youtube creators", "youtube official",
      "youtube spotlight", "youtube trends", "youtube news"
    ];
    
    const allChannels = await prisma.youTubeChannel.findMany({
      select: {
        channelName: true,
      },
    });
    
    const filteredChannels = allChannels.filter(channel => {
      const nameLower = channel.channelName.toLowerCase();
      return !officialKeywords.some(keyword => nameLower.includes(keyword));
    });
    
    console.log(`필터링 후 채널 수: ${filteredChannels.length.toLocaleString()}개`);
    console.log(`제외된 공식 채널: ${(totalChannels - filteredChannels.length).toLocaleString()}개`);
    
    // 국가별 분포
    const byCountry = await prisma.youTubeChannel.groupBy({
      by: ['country'],
      _count: { id: true },
      where: { country: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    });
    
    console.log(`\n국가별 분포: ${byCountry.length}개 국가`);
    console.log('\n상위 10개 국가:');
    byCountry.slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.country}: ${c._count.id.toLocaleString()}개`);
    });
    
    // 데이터 부족 국가 확인
    const MIN_REQUIRED = 200;
    const lowDataCountries = byCountry.filter(c => c._count.id < MIN_REQUIRED);
    const totalNeeded = lowDataCountries.reduce((sum, c) => sum + Math.max(0, MIN_REQUIRED - c._count.id), 0);
    
    console.log(`\n데이터 부족 국가: ${lowDataCountries.length}개`);
    console.log(`추가 수집 필요: ${totalNeeded.toLocaleString()}개 채널`);
    
    // API 할당량으로 수집 가능 여부
    const QUOTA_PER_KEY = 10000;
    const API_KEYS = 3;
    const TOTAL_QUOTA = QUOTA_PER_KEY * API_KEYS;
    const SEARCH_COST = 100;
    const CHANNELS_COST = 1;
    
    const maxSearchRequests = Math.floor(TOTAL_QUOTA / SEARCH_COST);
    const maxChannelsPerDay = Math.floor(maxSearchRequests * 50);
    
    console.log(`\n💡 추가 수집 가능 여부:`);
    console.log('-'.repeat(70));
    console.log(`일일 수집 가능: ${maxChannelsPerDay.toLocaleString()}개 채널`);
    console.log(`목표 달성 예상 일수: ${Math.ceil(totalNeeded / maxChannelsPerDay)}일`);
    
    if (totalNeeded > 0) {
      console.log(`\n✅ 추가 수집 가능합니다!`);
      console.log(`   • 현재: ${filteredChannels.length.toLocaleString()}개`);
      console.log(`   • 목표: ${(filteredChannels.length + totalNeeded).toLocaleString()}개`);
      console.log(`   • 추가 필요: ${totalNeeded.toLocaleString()}개`);
    } else {
      console.log(`\n✅ 모든 국가가 목표를 달성했습니다!`);
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentData();

