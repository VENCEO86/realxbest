import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, generateSessionToken, setSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:7',message:'로그인 요청 시작',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    const body = await request.json();
    const { username, password } = body;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:12',message:'로그인 요청 본문 파싱',data:{hasUsername:!!username,hasPassword:!!password,usernameLength:username?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!username || !password) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:16',message:'자격증명 누락',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json(
        { success: false, error: "사용자명과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 자격증명 검증
    const isValid = verifyAdminCredentials(username, password);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:25',message:'자격증명 검증 결과',data:{isValid,username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (isValid) {
      // 세션 토큰 생성
      const sessionToken = generateSessionToken();
      
      // 쿠키 설정
      const cookie = setSessionCookie(sessionToken);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:33',message:'로그인 성공 - 세션 토큰 생성',data:{tokenLength:sessionToken.length,cookieLength:cookie.length,cookieValue:cookie.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // 쿠키를 response에 직접 설정 (Next.js 13+ 방식)
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );
      
      // 방법 1: response.cookies.set() 사용
      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // strict에서 lax로 변경 (리다이렉트 호환성)
        maxAge: 86400, // 24시간
        path: "/",
      });
      
      // 방법 2: Set-Cookie 헤더도 직접 설정 (이중 보장)
      const cookieString = `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
      response.headers.append("Set-Cookie", cookieString);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:50',message:'쿠키 설정 완료',data:{hasResponse:!!response,hasCookies:!!response.cookies,cookieValue:response.cookies.get('admin_session')?.value?.substring(0,20)||'none',hasSetCookieHeader:response.headers.has('Set-Cookie')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      console.log('[LOGIN] 쿠키 설정 완료:', {
        hasResponse: !!response,
        hasCookies: !!response.cookies,
        cookieValue: response.cookies.get('admin_session')?.value?.substring(0, 20) || 'none',
        sessionToken: sessionToken.substring(0, 20),
        hasSetCookieHeader: response.headers.has('Set-Cookie'),
        setCookieHeader: response.headers.get('Set-Cookie')?.substring(0, 50) || 'none'
      });

      return response;
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:46',message:'자격증명 검증 실패',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json(
        { success: false, error: "사용자명 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/login/route.ts:52',message:'로그인 오류 발생',data:{errorMessage:error instanceof Error?error.message:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

