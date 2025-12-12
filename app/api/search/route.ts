import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchChannels } from "@/lib/youtube-search";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ channels: [] });
    }

    // YouTube API로 직접 검색
    const youtubeResults = await searchChannels(q, 20);
    
    if (youtubeResults.length > 0) {
      return NextResponse.json({ channels: youtubeResults });
    }

    if (!q || q.length < 2) {
      return NextResponse.json({ channels: [] });
    }

    const channels = await prisma.youTubeChannel.findMany({
      where: {
        OR: [
          { channelName: { contains: q, mode: "insensitive" } },
          { handle: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
      },
      take: 20,
    });

    const formattedChannels = channels.map((channel) => ({
      ...channel,
      subscriberCount: Number(channel.subscriberCount),
      totalViewCount: Number(channel.totalViewCount),
    }));

    return NextResponse.json({ channels: formattedChannels });
  } catch (error) {
    console.error("Error searching channels:", error);
    return NextResponse.json({ channels: [] });
  }
}

