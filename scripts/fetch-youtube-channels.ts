// YouTube Data API를 사용하여 실제 채널 데이터 수집
// 실행: YOUTUBE_API_KEY=your_key npx tsx scripts/fetch-youtube-channels.ts

import { PrismaClient } from "@prisma/client";
import { fetchChannelsBatch } from "../lib/youtube-api";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

// 인기 채널 ID 목록 (다양한 국가 포함)
const POPULAR_CHANNELS = [
  // 미국
  "UC-lHJZR3Gqxm24_Vd_AJ5Yw", // PewDiePie
  "UCX6OQ3DkcsbYNE6H8uQQuVA", // MrBeast
  "UCBJycsmduvYEL83R_U4JriQ", // Marshmello
  "UCJ0-Ot-VpW0uHJtZlo07ZtQ", // Cocomelon
  "UCYfdidRxbB8Qhf0Nx7ioOYw", // Kids Diana Show
  "UCXuqSBlHAE6Xw-yeJA0Tunw", // Linus Tech Tips
  
  // 인도
  "UCqVDpXKJQqrkn9NMynQiqkw", // SET India
  "UCq-Fj5jknLsUf-MWSy4_brA", // T-Series
  
  // 한국
  "UCyn-K7rZLXjGl7VXGweIlcA", // 백종원의 요리비책
  "UCXuqSBlHAE6Xw-yeJA0Tunw-KR", // 예시 (실제 ID로 교체 필요)
  
  // 기타 인기 채널
  "UCBJycsmduvYEL83R_U4JriQ-2", // 예시
];

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY 환경 변수가 설정되지 않았습니다.");
    console.log("사용법: YOUTUBE_API_KEY=your_key npx tsx scripts/fetch-youtube-channels.ts");
    process.exit(1);
  }

  console.log("YouTube 채널 데이터 수집 시작...");
  console.log(`수집할 채널 수: ${POPULAR_CHANNELS.length}`);

  // YouTube API에서 데이터 가져오기
  const channelsData = await fetchChannelsBatch(POPULAR_CHANNELS, apiKey);

  if (channelsData.length === 0) {
    console.error("채널 데이터를 가져올 수 없습니다.");
    process.exit(1);
  }

  console.log(`가져온 채널 수: ${channelsData.length}`);

  // 카테고리 매핑 (YouTube 카테고리를 우리 카테고리로)
  const categoryMap: Record<string, string> = {
    "Entertainment": "엔터테인먼트",
    "Music": "음악",
    "Education": "교육",
    "Gaming": "게임",
    "Sports": "스포츠",
    "News": "뉴스/정치",
    "People": "인물/블로그",
    "Howto": "노하우/스타일",
  };

  // 카테고리 생성
  const defaultCategory = await prisma.category.upsert({
    where: { name: "기타" },
    update: {},
    create: { name: "기타", nameEn: "Other" },
  });

  // 채널 저장
  let savedCount = 0;
  for (const channelData of channelsData) {
    try {
      // 카테고리 찾기 (기본값: 기타)
      let category = defaultCategory;
      // YouTube API에서 카테고리 정보를 가져올 수 있다면 매핑
      // 현재는 기본 카테고리 사용

      // 주간 변화율 계산 (예시 - 실제로는 이전 데이터와 비교 필요)
      const weeklySubscriberChange = Math.floor(channelData.subscriberCount * 0.01);
      const weeklyViewCount = Math.floor(channelData.totalViewCount * 0.05);
      const weeklySubscriberChangeRate = 1.0;
      const weeklyViewCountChangeRate = 5.0;
      const averageEngagementRate = 3.5;

      await prisma.youTubeChannel.upsert({
        where: { channelId: channelData.channelId },
        update: {
          channelName: channelData.channelName,
          handle: channelData.handle,
          profileImageUrl: channelData.profileImageUrl,
          subscriberCount: BigInt(channelData.subscriberCount),
          totalViewCount: BigInt(channelData.totalViewCount),
          videoCount: channelData.videoCount,
          weeklySubscriberChange: BigInt(weeklySubscriberChange),
          weeklySubscriberChangeRate,
          weeklyViewCount: BigInt(weeklyViewCount),
          weeklyViewCountChangeRate,
          averageEngagementRate,
          country: channelData.country,
          description: channelData.description,
          channelCreatedAt: channelData.channelCreatedAt,
          lastUpdated: new Date(),
        },
        create: {
          channelId: channelData.channelId,
          channelName: channelData.channelName,
          handle: channelData.handle,
          profileImageUrl: channelData.profileImageUrl,
          categoryId: category.id,
          subscriberCount: BigInt(channelData.subscriberCount),
          totalViewCount: BigInt(channelData.totalViewCount),
          videoCount: channelData.videoCount,
          weeklySubscriberChange: BigInt(weeklySubscriberChange),
          weeklySubscriberChangeRate,
          weeklyViewCount: BigInt(weeklyViewCount),
          weeklyViewCountChangeRate,
          averageEngagementRate,
          country: channelData.country,
          description: channelData.description,
          channelCreatedAt: channelData.channelCreatedAt,
        },
      });

      savedCount++;
      console.log(`✓ ${channelData.channelName} 저장 완료`);
    } catch (error) {
      console.error(`✗ ${channelData.channelName} 저장 실패:`, error);
    }
  }

  console.log(`\n완료! ${savedCount}/${channelsData.length}개 채널이 저장되었습니다.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

