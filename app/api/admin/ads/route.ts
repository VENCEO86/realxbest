import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies, verifySessionToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

async function checkAuth(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = getSessionFromCookies(cookieHeader);
  return sessionToken ? verifySessionToken(sessionToken) : false;
}

export async function GET(request: NextRequest) {
  // 인증 체크
  const authenticated = await checkAuth(request);
  if (!authenticated) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    const ads = await prisma.ad.findMany({
      include: {
        placements: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json(
      { error: "Failed to fetch ads", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 인증 체크
  const authenticated = await checkAuth(request);
  if (!authenticated) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const {
      name,
      type,
      content,
      position,
      displayConditions,
      schedule,
      frequency,
      status,
    } = body;

    // 광고 생성
    const ad = await prisma.ad.create({
      data: {
        name,
        type,
        content,
        position: position || {},
        displayConditions: displayConditions || {},
        schedule: schedule || {
          startDate: new Date().toISOString(),
          endDate: null,
        },
        frequency: frequency || {
          maxPerDay: 10,
          maxPerSession: 3,
        },
        status: status || "paused",
      },
    });

    // 배치 생성
    if (position) {
      await prisma.adPlacement.create({
        data: {
          adId: ad.id,
          page: position.page || "all",
          location: position.location || "content-top",
          priority: position.priority || 0,
        },
      });
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      { error: "Failed to create ad", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

