// 서버 컴포넌트에서 사용하는 관리자 인증 유틸리티

import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./auth";

/**
 * 서버 컴포넌트에서 관리자 인증 상태 확인
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:10',message:'서버 컴포넌트 인증 확인 시작',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  try {
    const cookieStore = await cookies();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:15',message:'쿠키 스토어 가져오기',data:{hasCookieStore:!!cookieStore,type:typeof cookieStore},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!cookieStore) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:19',message:'쿠키 스토어 없음',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return false;
    }
    
    let sessionCookie;
    try {
      sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    } catch (getError) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:28',message:'쿠키 get 오류',data:{errorMessage:getError instanceof Error?getError.message:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return false;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:35',message:'세션 쿠키 확인',data:{hasSessionCookie:!!sessionCookie,hasValue:!!sessionCookie?.value,valueLength:sessionCookie?.value?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    console.log('[AUTH] 세션 쿠키 확인:', {
      hasSessionCookie: !!sessionCookie,
      hasValue: !!sessionCookie?.value,
      valueLength: sessionCookie?.value?.length || 0,
      cookieName: SESSION_COOKIE_NAME
    });
    
    const sessionToken = sessionCookie?.value;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:39',message:'세션 토큰 확인',data:{hasSessionToken:!!sessionToken,tokenLength:sessionToken?.length||0,tokenPrefix:sessionToken?.substring(0,20)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!sessionToken) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:45',message:'세션 토큰 없음',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      return false;
    }

    const isValid = verifySessionToken(sessionToken);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:52',message:'토큰 검증 결과',data:{isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    console.log('[AUTH] 토큰 검증 결과:', {
      isValid,
      tokenLength: sessionToken?.length || 0
    });

    return isValid;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/admin-auth.ts:58',message:'인증 확인 오류',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack?.substring(0,200):'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    console.error("Auth check error:", error);
    return false;
  }
}

