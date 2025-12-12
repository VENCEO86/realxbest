"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ChannelSearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      // 채널 ID, 링크, 이름으로 검색
      let searchQuery = query.trim();

      // YouTube 링크에서 채널 ID 추출
      if (searchQuery.includes("youtube.com/channel/")) {
        const match = searchQuery.match(/channel\/([a-zA-Z0-9_-]+)/);
        if (match) searchQuery = match[1];
      } else if (searchQuery.includes("youtube.com/")) {
        const match = searchQuery.match(/youtube\.com\/([a-zA-Z0-9_-]+)/);
        if (match) searchQuery = match[1];
      } else if (searchQuery.includes("@")) {
        searchQuery = searchQuery.replace("@", "");
      }

      // API 호출
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.channels && data.channels.length > 0) {
        setResults(data.channels);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChannelClick = async (channelId: string) => {
    try {
      setShowResults(false);
      setQuery("");
      await router.push(`/channels/${channelId}`);
      router.refresh();
    } catch (error) {
      console.error("Channel click error:", error);
    }
  };

  return (
    <div className="relative mb-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setShowResults(false);
          }}
          placeholder="채널명, 채널 ID, 또는 YouTube 링크로 검색..."
          className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? "검색 중..." : "검색"}
        </button>
      </form>

      {/* 검색 결과 드롭다운 */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((channel: any) => (
            <div
              key={channel.id || channel.channelId}
              onClick={() => handleChannelClick(channel.channelId || channel.id)}
              className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {channel.profileImageUrl && (
                  <img
                    src={channel.profileImageUrl}
                    alt={channel.channelName}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium">{channel.channelName}</div>
                  {channel.handle && (
                    <div className="text-sm text-gray-500">@{channel.handle}</div>
                  )}
                  <div className="text-sm text-gray-400">
                    {channel.subscriberCount
                      ? `${(channel.subscriberCount / 1000000).toFixed(1)}M 구독자`
                      : "구독자 정보 없음"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

