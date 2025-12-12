"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatNumber } from "@/lib/utils";

async function fetchChannels(ids: string[]) {
  if (ids.length === 0) return [];
  const promises = ids.map(async (id) => {
    try {
      const r = await fetch(`/api/channels/${id}`);
      if (!r.ok) return null;
      return r.json();
    } catch (err) {
      return null;
    }
  });
  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}

export function ChannelCompare() {
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const { data: channels = [] } = useQuery({
    queryKey: ["compare", channelIds],
    queryFn: () => fetchChannels(channelIds),
    enabled: channelIds.length > 0,
  });

  const addChannel = () => {
    if (inputValue && channelIds.length < 5 && !channelIds.includes(inputValue)) {
      setChannelIds([...channelIds, inputValue]);
      setInputValue("");
    }
  };

  const removeChannel = (id: string) => {
    setChannelIds(channelIds.filter((cid) => cid !== id));
  };

  const chartData = channels.filter((c: any) => c && c.channelName).map((channel: any) => ({
    name: channel.channelName,
    구독자: (channel.subscriberCount || 0) / 10000, // 만 단위
    조회수: (channel.totalViewCount || 0) / 100000000, // 억 단위
    참여율: channel.averageEngagementRate || 0,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">채널 비교</h2>

      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="채널 ID 입력 (최대 5개)"
            className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700"
            onKeyPress={(e) => e.key === "Enter" && addChannel()}
          />
          <button
            onClick={addChannel}
            disabled={channelIds.length >= 5}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            추가
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {channelIds.map((id) => (
            <span
              key={id}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded flex items-center gap-2"
            >
              {id}
              <button
                onClick={() => removeChannel(id)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {channels.length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">구독자 수 비교</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="구독자" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channels.map((channel: any) => (
              <div key={channel.id} className="border rounded p-4">
                <h4 className="font-semibold mb-2">{channel.channelName}</h4>
                <div className="space-y-1 text-sm">
                  <div>구독자: {formatNumber(channel.subscriberCount)}</div>
                  <div>조회수: {formatNumber(channel.totalViewCount)}</div>
                  <div>참여율: {channel.averageEngagementRate.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

