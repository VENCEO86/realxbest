// 서버 컴포넌트에서 사용하는 관리자 인증 유틸리티

import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./auth";

/**
 * 서버 컴포넌트에서 관리자 인증 상태 확인
 */
export async function isAdminAuthenticated(): Promise<boolean> {

  try {
    const cookieStore = await cookies();

    if (!cookieStore) {

      return false;
    }
    
    let sessionCookie;
    try {
      sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    } catch (getError) {

      return false;
    }

    console.log('[AUTH] 세션 쿠키 확인:', {
      hasSessionCookie: !!sessionCookie,
      hasValue: !!sessionCookie?.value,
      valueLength: sessionCookie?.value?.length || 0,
      cookieName: SESSION_COOKIE_NAME
    });
    
    const sessionToken = sessionCookie?.value;

    if (!sessionToken) {

      return false;
    }

    const isValid = verifySessionToken(sessionToken);

    console.log('[AUTH] 토큰 검증 결과:', {
      isValid,
      tokenLength: sessionToken?.length || 0
    });

    return isValid;
  } catch (error) {

    console.error("Auth check error:", error);
    return false;
  }
}

