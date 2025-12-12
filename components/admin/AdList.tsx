"use client";

import { useQuery } from "@tanstack/react-query";
import { extractUrls, extractDomain } from "@/lib/url-utils";
import { LinkPreview } from "./LinkPreview";

async function fetchAds() {
  const response = await fetch("/api/admin/ads", {
    credentials: "include", // 쿠키 포함
  });
  if (!response.ok) return [];
  return response.json();
}

export function AdList() {
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: fetchAds,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">광고 목록</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">썸네일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">광고명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {ads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                  광고가 없습니다.
                </td>
              </tr>
            ) : (
              ads.map((ad: any) => {
                // content에서 URL 추출
                const urls = extractUrls(ad.content || "");
                const firstUrl = urls[0] || null;
                const domain = firstUrl ? extractDomain(firstUrl) : null;

                return (
                  <tr
                    key={ad.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3">
                      {firstUrl ? (
                        <LinkPreview url={firstUrl} size="sm" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">-</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{ad.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {firstUrl ? (
                        <a
                          href={firstUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate max-w-xs block"
                          title={firstUrl}
                        >
                          {firstUrl}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">URL 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {ad.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {ad.position?.page || "all"} / {ad.position?.location}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          ad.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ad.status === "active" ? "활성" : "일시정지"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
