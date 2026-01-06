import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies, verifySessionToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const sessionToken = getSessionFromCookies(cookieHeader);

    // 개발 환경에서만 상세 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('[CHECK-AUTH] 세션 토큰 확인:', {
        hasCookieHeader: !!cookieHeader,
        cookieHeaderLength: cookieHeader?.length || 0,
        hasSessionToken: !!sessionToken,
        tokenLength: sessionToken?.length || 0,
        isValid: sessionToken ? verifySessionToken(sessionToken) : false
      });
    }

    if (!sessionToken || !verifySessionToken(sessionToken)) {
      // 인증되지 않은 경우 200 OK로 반환 (401은 브라우저 콘솔에 오류로 표시됨)
      // authenticated: false로 클라이언트에서 처리하도록 함
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ authenticated: true }, { status: 200 });
  } catch (error) {
    console.error('[CHECK-AUTH] 오류 발생:', error);
    // 오류 발생 시에도 200 OK로 반환하여 브라우저 콘솔 오류 방지
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

