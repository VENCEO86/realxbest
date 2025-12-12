"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface AdPlacementProps {
  page: string;
  location: string;
}

async function fetchActiveAds(page: string, location: string) {
  const response = await fetch(`/api/ads/active?page=${page}&location=${location}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.ads || [];
}

async function fetchActivePixels() {
  const response = await fetch("/api/pixels/active");
  if (!response.ok) return [];
  const data = await response.json();
  return data.pixels || [];
}

export function AdPlacement({ page, location }: AdPlacementProps) {
  const { data: ads } = useQuery({
    queryKey: ["ads", page, location],
    queryFn: () => fetchActiveAds(page, location),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 픽셀 광고는 한 번만 로드 (페이지당)
  const { data: pixels = [] } = useQuery({
    queryKey: ["pixels", "active"],
    queryFn: fetchActivePixels,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // 픽셀 광고 삽입
  useEffect(() => {
    pixels.forEach((pixel: any) => {
      if (pixel.status === "active" && pixel.code) {
        const script = document.createElement("script");
        script.innerHTML = pixel.code;
        document.head.appendChild(script);
      }
    });
  }, [pixels]);

  if (!ads || ads.length === 0) {
    return null;
  }

  // 우선순위가 높은 광고만 표시
  const ad = ads.sort((a: any, b: any) => b.priority - a.priority)[0];

  if (!ad) return null;

  // 픽셀 광고는 보이지 않게 처리
  if (ad.type === "pixel") {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: ad.content }}
        style={{ display: "none" }}
      />
    );
  }

  // 다른 광고 타입은 내용 표시
  return (
    <div className="my-4">
      <div
        dangerouslySetInnerHTML={{ __html: ad.content }}
        className="ad-container"
      />
    </div>
  );
}

