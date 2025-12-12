import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Open Graph 이미지 프록시
 * 클라이언트에서 직접 접근할 수 없는 이미지를 프록시하여 제공
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // URL에서 Open Graph 이미지 추출 시도
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Open Graph 이미지 추출
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const imageUrl = ogImageMatch[1];
      
      // 절대 URL로 변환
      const absoluteImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : new URL(imageUrl, url).toString();

      // 이미지 프록시
      const imageResponse = await fetch(absoluteImageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": imageResponse.headers.get("Content-Type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400", // 24시간 캐시
          },
        });
      }
    }

    // Open Graph 이미지가 없으면 404
    return NextResponse.json({ error: "OG image not found" }, { status: 404 });
  } catch (error) {
    console.error("OG image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch OG image" },
      { status: 500 }
    );
  }
}

