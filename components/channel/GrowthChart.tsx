"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { format } from "date-fns";
import { formatNumber, formatChartNumber } from "@/lib/utils";

interface GrowthData {
  date: Date | string;
  subscriberCount: number | bigint;
  viewCount: number | bigint;
}

// 커스텀 Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {payload[0]?.payload?.date}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{" "}
            {entry.dataKey === "구독자"
              ? formatNumber(entry.value)
              : formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// YAxis 포맷터
const formatYAxis = (value: number) => {
  return formatChartNumber(value);
};

export function GrowthChart({ growthData }: { growthData: GrowthData[] }) {
  // 데이터 정규화 및 포맷팅
  const chartData = useMemo(() => {
    const safeGrowthData = Array.isArray(growthData) ? growthData : [];
    
    if (safeGrowthData.length === 0) return [];

    return safeGrowthData
      .slice()
      .reverse()
      .map((data) => {
        try {
          const date = data.date instanceof Date ? data.date : new Date(data.date);
          
          // BigInt 처리 및 정규화
          const subscriberCount = typeof data.subscriberCount === 'bigint' 
            ? Number(data.subscriberCount)
            : typeof data.subscriberCount === 'number'
            ? data.subscriberCount
            : Number(data.subscriberCount) || 0;
            
          const viewCount = typeof data.viewCount === 'bigint'
            ? Number(data.viewCount)
            : typeof data.viewCount === 'number'
            ? data.viewCount
            : Number(data.viewCount) || 0;
          
          return {
            date: format(date, "MM/dd"),
            dateFull: format(date, "yyyy-MM-dd"),
            구독자: subscriberCount,
            조회수: viewCount,
          };
        } catch (error) {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [growthData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">성장 추이</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">성장 데이터가 없습니다.</p>
      </div>
    );
  }

  // 최대값 계산 (YAxis 범위 설정용)
  const maxSubscribers = Math.max(...chartData.map(d => d.구독자));
  const maxViews = Math.max(...chartData.map(d => d.조회수));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">성장 추이</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">최근 {chartData.length}일간의 변화</p>
      </div>
      
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            className="dark:stroke-gray-700"
            opacity={0.3}
          />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            className="text-xs"
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6366f1"
            tick={{ fill: '#6366f1', fontSize: 11 }}
            tickFormatter={formatYAxis}
            width={60}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="#10b981"
            tick={{ fill: '#10b981', fontSize: 11 }}
            tickFormatter={formatYAxis}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
            )}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="구독자"
            name="구독자"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2 }}
            animationDuration={300}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="조회수"
            name="조회수"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2 }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

