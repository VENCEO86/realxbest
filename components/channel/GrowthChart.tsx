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

// 커스텀 Tooltip (심플하고 포인트 있는 디자인)
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 backdrop-blur-md">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          {payload[0]?.payload?.dateFull || payload[0]?.payload?.date}
        </p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-4">
              <div 
                className="w-4 h-4 rounded-full shadow-sm border-2 border-white dark:border-gray-800" 
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                  {entry.name}
                </p>
                <p 
                  className="text-lg font-bold" 
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

// YAxis 포맷터 (간결하고 읽기 쉬운 버전)
const formatYAxis = (value: number) => {
  if (value === 0) return "0";
  
  // 억 단위
  if (value >= 100000000) {
    const eok = value / 100000000;
    if (eok >= 10) {
      return Math.floor(eok) + "억";
    }
    return eok.toFixed(1) + "억";
  }
  
  // 만 단위
  if (value >= 10000) {
    const man = value / 10000;
    if (man >= 1000) {
      return (man / 1000).toFixed(1) + "천만";
    }
    if (man >= 100) {
      return Math.floor(man) + "만";
    }
    return man.toFixed(1) + "만";
  }
  
  // 천 단위
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + "천";
  }
  
  return value.toString();
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
      {/* 헤더 섹션 - 심플하고 포인트 있는 디자인 */}
      <div className="mb-8 pb-6 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
              성장 추이
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              최근 {chartData.length}일간의 변화 추이
            </p>
          </div>
          {/* 통계 요약 - 포인트 있는 디자인 */}
          <div className="flex gap-6 text-right">
            <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1 uppercase tracking-wide">구독자</p>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                {formatNumber(chartData[chartData.length - 1]?.구독자 || 0)}
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 uppercase tracking-wide">조회수</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {formatNumber(chartData[chartData.length - 1]?.조회수 || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 차트 섹션 - 깔끔한 디자인 */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData} 
          margin={{ top: 10, right: 25, left: 5, bottom: 10 }}
        >
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke="#e5e7eb" 
            className="dark:stroke-gray-700"
            opacity={0.3}
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            className="text-xs"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
            tickLine={{ stroke: '#9ca3af', opacity: 0.5 }}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1.5 }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6366f1"
            tick={{ fill: '#6366f1', fontSize: 12, fontWeight: 700 }}
            tickFormatter={formatYAxis}
            width={75}
            tickLine={{ stroke: '#6366f1', opacity: 0.4 }}
            axisLine={{ stroke: '#6366f1', opacity: 0.5, strokeWidth: 1.5 }}
            label={{ value: '구독자', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6366f1', fontSize: 11, fontWeight: 600 } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="#10b981"
            tick={{ fill: '#10b981', fontSize: 12, fontWeight: 700 }}
            tickFormatter={formatYAxis}
            width={75}
            tickLine={{ stroke: '#10b981', opacity: 0.4 }}
            axisLine={{ stroke: '#10b981', opacity: 0.5, strokeWidth: 1.5 }}
            label={{ value: '조회수', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#10b981', fontSize: 11, fontWeight: 600 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '28px', paddingBottom: '12px' }}
            iconType="line"
            iconSize={16}
            formatter={(value) => (
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
            iconStyle={{ strokeWidth: 3 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="구독자"
            name="구독자"
            stroke="#6366f1"
            strokeWidth={3.5}
            dot={false}
            activeDot={{ 
              r: 7, 
              fill: '#6366f1', 
              strokeWidth: 3,
              stroke: '#ffffff',
              className: 'drop-shadow-lg',
              style: { filter: 'drop-shadow(0 4px 6px rgba(99, 102, 241, 0.3))' }
            }}
            animationDuration={500}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="조회수"
            name="조회수"
            stroke="#10b981"
            strokeWidth={3.5}
            dot={false}
            activeDot={{ 
              r: 7, 
              fill: '#10b981', 
              strokeWidth: 3,
              stroke: '#ffffff',
              className: 'drop-shadow-lg',
              style: { filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.3))' }
            }}
            animationDuration={500}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

