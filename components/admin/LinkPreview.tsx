"use client";

import { useState, useEffect } from "react";
import { extractDomain, getFaviconUrl, getOgImageUrl, isValidUrl } from "@/lib/url-utils";
import Image from "next/image";

interface LinkPreviewProps {
  url: string;
  size?: "sm" | "md" | "lg";
}

export function LinkPreview({ url, size = "md" }: LinkPreviewProps) {
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const domain = extractDomain(url);
  const faviconUrl = domain ? getFaviconUrl(domain) : null;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  useEffect(() => {
    if (!isValidUrl(url)) {
      setLoading(false);
      setError(true);
      return;
    }

    // Open Graph 이미지 가져오기 시도
    const fetchOgImage = async () => {
      try {
        const ogImageUrl = getOgImageUrl(url);
        const response = await fetch(ogImageUrl);
        
        if (response.ok) {
          // 이미지가 성공적으로 로드되면 사용
          setOgImage(ogImageUrl);
        } else {
          // OG 이미지가 없으면 파비콘 사용
          setOgImage(null);
        }
      } catch (err) {
        // 오류 발생 시 파비콘 사용
        setOgImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOgImage();
  }, [url]);

  if (error || !domain) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">?</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center animate-pulse`}>
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0`}>
      {ogImage ? (
        <Image
          src={ogImage}
          alt={domain}
          fill
          className="object-cover"
          onError={() => setOgImage(null)}
        />
      ) : faviconUrl ? (
        <Image
          src={faviconUrl}
          alt={domain}
          fill
          className="object-contain p-1"
          onError={() => {
            // 파비콘도 실패하면 도메인 첫 글자 표시
            setError(true);
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
          {domain.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}


