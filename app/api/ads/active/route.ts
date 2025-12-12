import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "all";
    const location = searchParams.get("location") || "";

    const now = new Date();

    // 활성 광고 조회 (JSON 필드는 클라이언트 측에서 필터링)
    const ads = await prisma.ad.findMany({
      where: {
        status: "active",
      },
      include: {
        placements: {
          where: {
            OR: [
              { page: "all" },
              { page },
            ],
            location,
          },
        },
      },
    });

    // 배치 조건에 맞는 광고만 필터링
    const filteredAds = ads.filter((ad) => {
      const placements = ad.placements;
      if (placements.length === 0) return false;

      // 스케줄 확인 (JSON 필드)
      const schedule = ad.schedule as any;
      if (schedule) {
        if (schedule.startDate && new Date(schedule.startDate) > now) return false;
        if (schedule.endDate && new Date(schedule.endDate) < now) return false;
      }

      // 페이지 및 위치 조건 확인
      return placements.some(
        (p) => (p.page === "all" || p.page === page) && p.location === location
      );
    });

    return NextResponse.json({
      ads: filteredAds.map((ad) => ({
        id: ad.id,
        name: ad.name,
        type: ad.type,
        content: ad.content,
        priority: ad.placements[0]?.priority || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching active ads:", error);
    return NextResponse.json({ ads: [] });
  }
}

