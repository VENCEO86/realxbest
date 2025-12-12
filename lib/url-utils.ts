/**
 * URL 관련 유틸리티 함수
 */

/**
 * 텍스트에서 URL 추출
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * URL에서 도메인 추출
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * 파비콘 URL 생성
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

/**
 * Open Graph 이미지 URL 가져오기 (프록시 사용)
 */
export function getOgImageUrl(url: string): string {
  // Next.js Image Optimization을 사용하여 프록시
  return `/api/og-image?url=${encodeURIComponent(url)}`;
}

/**
 * URL이 유효한지 확인
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}


