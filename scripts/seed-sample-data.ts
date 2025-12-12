// 샘플 데이터 생성 스크립트
// 실행: npx tsx scripts/seed-sample-data.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

const SAMPLE_CHANNELS = [
  {
    channelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    channelName: "PewDiePie",
    handle: "pewdiepie",
    country: "SE",
    category: "엔터테인먼트",
    subscriberCount: 111000000,
    totalViewCount: 28000000000,
    videoCount: 4700,
  },
  {
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    channelName: "MrBeast",
    handle: "MrBeast",
    country: "US",
    category: "엔터테인먼트",
    subscriberCount: 245000000,
    totalViewCount: 50000000000,
    videoCount: 800,
  },
  {
    channelId: "UCBJycsmduvYEL83R_U4JriQ",
    channelName: "Marshmello",
    handle: "marshmello",
    country: "US",
    category: "음악",
    subscriberCount: 62000000,
    totalViewCount: 18000000000,
    videoCount: 200,
  },
  {
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    channelName: "T-Series",
    handle: "tseries",
    country: "IN",
    category: "음악",
    subscriberCount: 260000000,
    totalViewCount: 250000000000,
    videoCount: 20000,
  },
  {
    channelId: "UCqVDpXKJQqrkn9NMynQiqkw",
    channelName: "SET India",
    handle: "SETIndia",
    country: "IN",
    category: "엔터테인먼트",
    subscriberCount: 170000000,
    totalViewCount: 150000000000,
    videoCount: 50000,
  },
  {
    channelId: "UCJ0-Ot-VpW0uHJtZlo07ZtQ",
    channelName: "Cocomelon - Nursery Rhymes",
    handle: "Cocomelon",
    country: "US",
    category: "교육",
    subscriberCount: 180000000,
    totalViewCount: 170000000000,
    videoCount: 900,
  },
  {
    channelId: "UCYfdidRxbB8Qhf0Nx7ioOYw",
    channelName: "Kids Diana Show",
    handle: "KidsDianaShow",
    country: "US",
    category: "엔터테인먼트",
    subscriberCount: 120000000,
    totalViewCount: 100000000000,
    videoCount: 2000,
  },
  {
    channelId: "UCBJycsmduvYEL83R_U4JriQ",
    channelName: "Like Nastya",
    handle: "LikeNastya",
    country: "US",
    category: "엔터테인먼트",
    subscriberCount: 110000000,
    totalViewCount: 90000000000,
    videoCount: 1500,
  },
  {
    channelId: "UCXuqSBlHAE6Xw-yeJA0Tunw",
    channelName: "Linus Tech Tips",
    handle: "LinusTechTips",
    country: "CA",
    category: "교육",
    subscriberCount: 16000000,
    totalViewCount: 8000000000,
    videoCount: 5000,
  },
  {
    channelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    channelName: "Dude Perfect",
    handle: "DudePerfect",
    country: "US",
    category: "엔터테인먼트",
    subscriberCount: 60000000,
    totalViewCount: 15000000000,
    videoCount: 400,
  },
];

async function main() {
  console.log("샘플 데이터 생성 시작...");

  // 카테고리 생성
  const categories = [
    { name: "엔터테인먼트", nameEn: "Entertainment" },
    { name: "음악", nameEn: "Music" },
    { name: "교육", nameEn: "Education" },
    { name: "게임", nameEn: "Gaming" },
    { name: "스포츠", nameEn: "Sports" },
    { name: "뉴스/정치", nameEn: "News" },
    { name: "인물/블로그", nameEn: "People" },
    { name: "노하우/스타일", nameEn: "Howto" },
    { name: "기타", nameEn: "Other" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("카테고리 생성 완료");

  // 채널 생성
  for (const channel of SAMPLE_CHANNELS) {
    const category = await prisma.category.findUnique({
      where: { name: channel.category },
    });

    if (!category) {
      console.error(`카테고리를 찾을 수 없습니다: ${channel.category}`);
      continue;
    }

    const weeklySubscriberChange = Math.floor(channel.subscriberCount * 0.01);
    const weeklyViewCount = Math.floor(channel.totalViewCount * 0.05);
    const weeklySubscriberChangeRate = 1.0;
    const weeklyViewCountChangeRate = 5.0;
    const averageEngagementRate = 3.5;

    await prisma.youTubeChannel.upsert({
      where: { channelId: channel.channelId },
      update: {
        channelName: channel.channelName,
        handle: channel.handle,
        subscriberCount: BigInt(channel.subscriberCount),
        totalViewCount: BigInt(channel.totalViewCount),
        videoCount: channel.videoCount,
        weeklySubscriberChange: BigInt(weeklySubscriberChange),
        weeklySubscriberChangeRate,
        weeklyViewCount: BigInt(weeklyViewCount),
        weeklyViewCountChangeRate,
        averageEngagementRate,
        country: channel.country,
        lastUpdated: new Date(),
      },
      create: {
        channelId: channel.channelId,
        channelName: channel.channelName,
        handle: channel.handle,
        categoryId: category.id,
        subscriberCount: BigInt(channel.subscriberCount),
        totalViewCount: BigInt(channel.totalViewCount),
        videoCount: channel.videoCount,
        weeklySubscriberChange: BigInt(weeklySubscriberChange),
        weeklySubscriberChangeRate,
        weeklyViewCount: BigInt(weeklyViewCount),
        weeklyViewCountChangeRate,
        averageEngagementRate,
        country: channel.country,
      },
    });
  }

  console.log("채널 데이터 생성 완료");
  console.log(`${SAMPLE_CHANNELS.length}개의 샘플 채널이 생성되었습니다.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

