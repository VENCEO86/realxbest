import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 급상승 채널 (주간 구독자 증가율 상위)
    const rising = await prisma.youTubeChannel.findMany({
      where: {
        weeklySubscriberChangeRate: { gt: 5 },
      },
      orderBy: { weeklySubscriberChangeRate: "desc" },
      take: 10,
      include: { category: true },
    });

    // 급하락 채널 (주간 구독자 감소율 상위)
    const falling = await prisma.youTubeChannel.findMany({
      where: {
        weeklySubscriberChangeRate: { lt: -5 },
      },
      orderBy: { weeklySubscriberChangeRate: "asc" },
      take: 10,
      include: { category: true },
    });

    // 신규 진입 채널 (최근 생성)
    const newChannels = await prisma.youTubeChannel.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { category: true },
    });

    const formatChannel = (channel: any) => ({
      ...channel,
      subscriberCount: Number(channel.subscriberCount),
      totalViewCount: Number(channel.totalViewCount),
      weeklySubscriberChange: Number(channel.weeklySubscriberChange || 0),
      weeklyViewCount: Number(channel.weeklyViewCount || 0),
      weeklyViewCountChange: Number(channel.weeklyViewCountChange || 0),
    });

    return NextResponse.json({
      rising: rising.map(formatChannel),
      falling: falling.map(formatChannel),
      new: newChannels.map(formatChannel),
    });
  } catch (error) {
    console.error("Error fetching trends:", error);
    return NextResponse.json({
      rising: [],
      falling: [],
      new: [],
    });
  }
}

