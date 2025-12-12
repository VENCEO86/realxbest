import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies, verifySessionToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/check-auth/route.ts:7',message:'인증 상태 확인 요청',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  try {
    const cookieHeader = request.headers.get("cookie");
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/check-auth/route.ts:12',message:'쿠키 헤더 확인',data:{hasCookieHeader:!!cookieHeader,cookieHeaderLength:cookieHeader?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const sessionToken = getSessionFromCookies(cookieHeader);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/check-auth/route.ts:18',message:'세션 토큰 추출',data:{hasSessionToken:!!sessionToken,tokenLength:sessionToken?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    console.log('[CHECK-AUTH] 세션 토큰 확인:', {
      hasCookieHeader: !!cookieHeader,
      cookieHeaderLength: cookieHeader?.length || 0,
      hasSessionToken: !!sessionToken,
      tokenLength: sessionToken?.length || 0,
      isValid: sessionToken ? verifySessionToken(sessionToken) : false
    });

    if (!sessionToken || !verifySessionToken(sessionToken)) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/check-auth/route.ts:22',message:'인증 실패',data:{hasToken:!!sessionToken,isValid:sessionToken?verifySessionToken(sessionToken):false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/check-auth/route.ts:28',message:'인증 성공',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/check-auth/route.ts:33',message:'인증 확인 오류',data:{errorMessage:error instanceof Error?error.message:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

