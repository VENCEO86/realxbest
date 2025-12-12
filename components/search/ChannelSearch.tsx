"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

async function searchChannels(query: string) {
  if (!query) return { channels: [] };
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return { channels: [] };
  return response.json();
}

export function ChannelSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => searchChannels(searchQuery),
    enabled: searchQuery.length > 0,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">채널 검색</h2>
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="채널명 또는 @핸들로 검색..."
          className="w-full px-4 py-2 border rounded-md dark:bg-gray-700"
        />
      </div>

      {isLoading && <div className="text-center py-4">검색 중...</div>}

      {data?.channels && data.channels.length > 0 && (
        <div className="space-y-2">
          {data.channels.map((channel: any) => (
            <Link
              key={channel.id}
              href={`/channels/${channel.id}`}
              className="block p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="font-medium">{channel.channelName}</div>
              {channel.handle && (
                <div className="text-sm text-gray-500">@{channel.handle}</div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                구독자: {formatNumber(channel.subscriberCount)} | 카테고리: {channel.category?.name}
              </div>
            </Link>
          ))}
        </div>
      )}

      {searchQuery && !isLoading && data?.channels?.length === 0 && (
        <div className="text-center py-8 text-gray-500">검색 결과가 없습니다.</div>
      )}
    </div>
  );
}

