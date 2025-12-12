// YouTube 데이터 동기화 API
// 실제 YouTube API를 통해 데이터를 가져와서 데이터베이스에 저장합니다.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelsBatch } from "@/lib/youtube-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelIds, apiKey } = body;

    if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: "channelIds 배열이 필요합니다." },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API key가 필요합니다." },
        { status: 400 }
      );
    }

    // YouTube API에서 데이터 가져오기
    const channelsData = await fetchChannelsBatch(channelIds, apiKey);

    if (channelsData.length === 0) {
      return NextResponse.json({
        message: "가져온 채널 데이터가 없습니다.",
        synced: 0,
      });
    }

    // 데이터베이스에 저장/업데이트
    let syncedCount = 0;
    const categoryMap: Record<string, string> = {
      Entertainment: "엔터테인먼트",
      Music: "음악",
      Education: "교육",
      Gaming: "게임",
      Sports: "스포츠",
      News: "뉴스/정치",
      People: "인물/블로그",
      Howto: "노하우/스타일",
    };

    for (const channelData of channelsData) {
      try {
        // 기본 카테고리 찾기 또는 생성
        let category = await prisma.category.findFirst({
          where: { name: "기타" },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: "기타",
              nameEn: "Other",
            },
          });
        }

        // 채널 업데이트 또는 생성
        await prisma.youTubeChannel.upsert({
          where: { channelId: channelData.channelId },
          update: {
            channelName: channelData.channelName,
            handle: channelData.handle,
            profileImageUrl: channelData.profileImageUrl,
            subscriberCount: BigInt(channelData.subscriberCount),
            totalViewCount: BigInt(channelData.totalViewCount),
            videoCount: channelData.videoCount,
            description: channelData.description,
            country: channelData.country,
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
            description: channelData.description,
            country: channelData.country,
            channelCreatedAt: channelData.channelCreatedAt,
          },
        });

        syncedCount++;
      } catch (error) {
        console.error(`Error syncing channel ${channelData.channelId}:`, error);
      }
    }

    return NextResponse.json({
      message: `${syncedCount}개의 채널이 동기화되었습니다.`,
      synced: syncedCount,
      total: channelsData.length,
    });
  } catch (error) {
    console.error("Error in sync route:", error);
    return NextResponse.json(
      {
        error: "동기화 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

