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
    const pixels = await prisma.pixel.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pixels);
  } catch (error) {
    console.error("Error fetching pixels:", error);
    return NextResponse.json([]);
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
    const { name, type, code, events, status } = body;

    const pixel = await prisma.pixel.create({
      data: {
        name,
        type,
        code,
        events: events || [],
        status: status || "paused",
      },
    });

    return NextResponse.json(pixel);
  } catch (error) {
    console.error("Error creating pixel:", error);
    return NextResponse.json(
      { error: "Failed to create pixel", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

