import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies, verifySessionToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {

  try {
    const cookieHeader = request.headers.get("cookie");

    const sessionToken = getSessionFromCookies(cookieHeader);

    console.log('[CHECK-AUTH] 세션 토큰 확인:', {
      hasCookieHeader: !!cookieHeader,
      cookieHeaderLength: cookieHeader?.length || 0,
      hasSessionToken: !!sessionToken,
      tokenLength: sessionToken?.length || 0,
      isValid: sessionToken ? verifySessionToken(sessionToken) : false
    });

    if (!sessionToken || !verifySessionToken(sessionToken)) {

      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {

    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

