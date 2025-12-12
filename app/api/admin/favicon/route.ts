import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 가장 최근 활성화된 파비콘 설정 가져오기
    const config = await prisma.faviconConfig.findFirst({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(config || {
      favicon16: null,
      favicon32: null,
      favicon48: null,
      appleTouchIcon: null,
    });
  } catch (error) {
    console.error("Error fetching favicon config:", error);
    return NextResponse.json(
      { error: "Failed to fetch favicon config" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { favicon16, favicon32, favicon48, appleTouchIcon } = body;

    // 기존 활성 설정 찾기
    const existing = await prisma.faviconConfig.findFirst({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      // 기존 설정 업데이트
      const updated = await prisma.faviconConfig.update({
        where: { id: existing.id },
        data: {
          favicon16: favicon16 !== undefined ? favicon16 : existing.favicon16,
          favicon32: favicon32 !== undefined ? favicon32 : existing.favicon32,
          favicon48: favicon48 !== undefined ? favicon48 : existing.favicon48,
          appleTouchIcon: appleTouchIcon !== undefined ? appleTouchIcon : existing.appleTouchIcon,
        },
      });
      return NextResponse.json(updated);
    } else {
      // 새 설정 생성
      const created = await prisma.faviconConfig.create({
        data: {
          favicon16: favicon16 || null,
          favicon32: favicon32 || null,
          favicon48: favicon48 || null,
          appleTouchIcon: appleTouchIcon || null,
          status: "active",
        },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Error updating favicon config:", error);
    return NextResponse.json(
      { error: "Failed to update favicon config", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

