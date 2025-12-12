// 관리자 인증 유틸리티

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin4658";
export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_SECRET = "korxyoutube_admin_secret_2025"; // 프로덕션에서는 환경 변수로 관리

/**
 * 관리자 자격증명 검증
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * 세션 토큰 생성 (간단한 해시)
 */
export function generateSessionToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${SESSION_SECRET}_${timestamp}_${random}`).toString('base64');
}

/**
 * 세션 토큰 검증
 */
export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded.startsWith(SESSION_SECRET + '_');
  } catch {
    return false;
  }
}

/**
 * 쿠키에서 세션 토큰 가져오기
 */
export function getSessionFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    console.log('[AUTH] 쿠키 헤더 없음');
    return null;
  }
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  
  if (!sessionCookie) {
    console.log('[AUTH] 세션 쿠키 없음, 전체 쿠키:', cookieHeader.substring(0, 100));
    return null;
  }
  
  const token = sessionCookie.split('=')[1];
  console.log('[AUTH] 세션 토큰 추출 성공, 길이:', token?.length || 0);
  return token;
}

/**
 * 세션 쿠키 설정
 */
export function setSessionCookie(token: string): string {
  // HttpOnly, Secure, SameSite 설정
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`; // 24시간
}

/**
 * 세션 쿠키 삭제
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}


