import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 전체 채널 수
    const totalChannels = await prisma.youTubeChannel.count();

    // 최근 24시간 내 추가된 채널 수
    const recentChannels = await prisma.youTubeChannel.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // 최근 24시간 내 업데이트된 채널 수
    const updatedChannels = await prisma.youTubeChannel.count({
      where: {
        lastUpdated: {
          gte: oneDayAgo,
        },
      },
    });

    // 국가별 신규 채널 현황
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

    // 카테고리별 신규 채널 현황
    const recentByCategoryRaw = await prisma.youTubeChannel.groupBy({
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
    const recentByCategory = await Promise.all(
      recentByCategoryRaw.map(async (item) => {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
          select: { name: true },
        });
        return {
          categoryName: category?.name || '미지정',
          count: item._count.id,
        };
      })
    );

    // 최근 추가된 채널 샘플
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

    return NextResponse.json({
      period: {
        start: oneDayAgo.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalChannels,
        recentChannels,
        updatedChannels,
        growthRate: totalChannels > 0 
          ? ((recentChannels / totalChannels) * 100).toFixed(2)
          : '0.00',
      },
      byCountry: recentByCountry.map(item => ({
        country: item.country || '미지정',
        count: item._count.id,
      })),
      byCategory: recentByCategory,
      recentSamples: recentSamples.map(channel => ({
        channelName: channel.channelName,
        country: channel.country || '미지정',
        category: channel.category?.name || '미지정',
        subscribers: Number(channel.subscriberCount),
        createdAt: channel.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('[Stats API] 오류:', error);
    return NextResponse.json(
      { error: '데이터 조회 실패', message: error.message },
      { status: 500 }
    );
  }
}

