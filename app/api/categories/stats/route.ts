import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        channels: true,
      },
    });

    const stats = categories.map((category) => {
      const channels = category.channels;
      const totalChannels = channels.length;
      const avgSubscribers =
        totalChannels > 0
          ? channels.reduce((sum, c) => sum + Number(c.subscriberCount), 0) / totalChannels
          : 0;
      const avgViews =
        totalChannels > 0
          ? channels.reduce((sum, c) => sum + Number(c.totalViewCount), 0) / totalChannels
          : 0;
      const avgEngagement =
        totalChannels > 0
          ? channels.reduce((sum, c) => sum + c.averageEngagementRate, 0) / totalChannels
          : 0;

      return {
        id: category.id,
        name: category.name,
        totalChannels,
        avgSubscribers: Math.floor(avgSubscribers),
        avgViews: Math.floor(avgViews),
        avgEngagement: avgEngagement.toFixed(2),
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    return NextResponse.json([]);
  }
}

