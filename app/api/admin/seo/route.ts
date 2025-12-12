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

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "/";

    const config = await prisma.sEOConfig.findUnique({
      where: { page },
    });

    return NextResponse.json(config || {
      page,
      title: "",
      description: "",
      keywords: [],
      ogImage: null,
      ogTitle: null,
      ogDescription: null,
      twitterCard: null,
      canonicalUrl: null,
    });
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO config" },
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
    const {
      page,
      title,
      description,
      keywords,
      ogImage,
      ogTitle,
      ogDescription,
      twitterCard,
      canonicalUrl,
    } = body;

    if (!page) {
      return NextResponse.json(
        { error: "페이지 경로가 필요합니다." },
        { status: 400 }
      );
    }

    // 기존 설정 찾기
    const existing = await prisma.sEOConfig.findUnique({
      where: { page },
    });

    if (existing) {
      // 업데이트
      const updated = await prisma.sEOConfig.update({
        where: { page },
        data: {
          title: title || "",
          description: description || "",
          keywords: keywords || [],
          ogImage: ogImage || null,
          ogTitle: ogTitle || null,
          ogDescription: ogDescription || null,
          twitterCard: twitterCard || null,
          canonicalUrl: canonicalUrl || null,
        },
      });
      return NextResponse.json(updated);
    } else {
      // 생성
      const created = await prisma.sEOConfig.create({
        data: {
          page,
          title: title || "",
          description: description || "",
          keywords: keywords || [],
          ogImage: ogImage || null,
          ogTitle: ogTitle || null,
          ogDescription: ogDescription || null,
          twitterCard: twitterCard || null,
          canonicalUrl: canonicalUrl || null,
        },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Error updating SEO config:", error);
    return NextResponse.json(
      { error: "Failed to update SEO config", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

