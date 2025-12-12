"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

async function fetchTrends() {
  const response = await fetch("/api/trends");
  if (!response.ok) return { rising: [], falling: [], new: [] };
  return response.json();
}

export function TrendAnalysis() {
  const { data, isLoading } = useQuery({
    queryKey: ["trends"],
    queryFn: fetchTrends,
  });

  if (isLoading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-green-600">급상승 채널</h2>
        <div className="space-y-3">
          {data?.rising?.slice(0, 5).map((channel: any) => (
            <Link
              key={channel.id}
              href={`/channels/${channel.id}`}
              className="block hover:text-blue-600"
            >
              <div className="font-medium">{channel.channelName}</div>
              <div className="text-sm text-gray-600">
                +{channel.weeklySubscriberChangeRate.toFixed(1)}%
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-red-600">급하락 채널</h2>
        <div className="space-y-3">
          {data?.falling?.slice(0, 5).map((channel: any) => (
            <Link
              key={channel.id}
              href={`/channels/${channel.id}`}
              className="block hover:text-blue-600"
            >
              <div className="font-medium">{channel.channelName}</div>
              <div className="text-sm text-gray-600">
                {channel.weeklySubscriberChangeRate.toFixed(1)}%
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-600">신규 진입</h2>
        <div className="space-y-3">
          {data?.new?.slice(0, 5).map((channel: any) => (
            <Link
              key={channel.id}
              href={`/channels/${channel.id}`}
              className="block hover:text-blue-600"
            >
              <div className="font-medium">{channel.channelName}</div>
              <div className="text-sm text-gray-600">
                {formatNumber(channel.subscriberCount)} 구독자
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

