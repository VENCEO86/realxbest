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
} from "recharts";
import { format } from "date-fns";
import { formatNumber, formatChartNumber } from "@/lib/utils";

interface GrowthData {
  date: Date | string;
  subscriberCount: number | bigint;
  viewCount: number | bigint;
}

// 커스텀 Tooltip (개선된 디자인)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 backdrop-blur-sm">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
          {payload[0]?.payload?.dateFull || payload[0]?.payload?.date}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {entry.name}
                </p>
                <p 
                  className="text-sm font-bold mt-0.5" 
                  style={{ color: entry.color }}
                >
                  {formatNumber(entry.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// YAxis 포맷터 (개선된 버전)
const formatYAxis = (value: number) => {
  const formatted = formatChartNumber(value);
  // 너무 긴 경우 더 간결하게
  if (formatted.length > 6) {
    if (value >= 100000000) {
      return (value / 100000000).toFixed(1) + "억";
    }
    if (value >= 10000) {
      return (value / 10000).toFixed(0) + "만";
    }
  }
  return formatted;
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">성장 추이</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">성장 데이터가 없습니다.</p>
      </div>
    );
  }

  // 최대값 계산 (YAxis 범위 설정용)
  const maxSubscribers = Math.max(...chartData.map(d => d.구독자));
  const maxViews = Math.max(...chartData.map(d => d.조회수));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
      {/* 헤더 섹션 */}
      <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              성장 추이
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              최근 {chartData.length}일간의 변화
            </p>
          </div>
          {/* 통계 요약 */}
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">구독자</p>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {formatNumber(chartData[chartData.length - 1]?.구독자 || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">조회수</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatNumber(chartData[chartData.length - 1]?.조회수 || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 차트 섹션 */}
      <ResponsiveContainer width="100%" height={380}>
        <LineChart 
          data={chartData} 
          margin={{ top: 10, right: 25, left: 5, bottom: 10 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            className="dark:stroke-gray-700"
            opacity={0.2}
          />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            className="text-xs"
            tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
            tickLine={{ stroke: '#d1d5db' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6366f1"
            tick={{ fill: '#6366f1', fontSize: 11, fontWeight: 600 }}
            tickFormatter={formatYAxis}
            width={70}
            tickLine={{ stroke: '#6366f1', opacity: 0.3 }}
            axisLine={{ stroke: '#6366f1', opacity: 0.3 }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="#10b981"
            tick={{ fill: '#10b981', fontSize: 11, fontWeight: 600 }}
            tickFormatter={formatYAxis}
            width={70}
            tickLine={{ stroke: '#10b981', opacity: 0.3 }}
            axisLine={{ stroke: '#10b981', opacity: 0.3 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '24px', paddingBottom: '8px' }}
            iconType="line"
            iconSize={14}
            formatter={(value) => (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="구독자"
            name="구독자"
            stroke="#6366f1"
            strokeWidth={3}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: '#6366f1', 
              strokeWidth: 2,
              stroke: '#ffffff',
              className: 'drop-shadow-sm'
            }}
            animationDuration={400}
            strokeLinecap="round"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="조회수"
            name="조회수"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: '#10b981', 
              strokeWidth: 2,
              stroke: '#ffffff',
              className: 'drop-shadow-sm'
            }}
            animationDuration={400}
            strokeLinecap="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

