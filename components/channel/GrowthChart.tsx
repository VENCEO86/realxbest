"use client";

import { useEffect } from "react";
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
import { formatNumber } from "@/lib/utils";

interface GrowthData {
  date: Date;
  subscriberCount: number;
  viewCount: number;
}

export function GrowthChart({ growthData }: { growthData: GrowthData[] }) {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/6ba67444-070e-4761-a65f-f3790b0cf0ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/channel/GrowthChart.tsx:24',message:'GrowthChart 렌더링',data:{hasGrowthData:!!growthData,growthDataLength:growthData?.length || 0,firstItem:growthData?.[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }, [growthData]);
  // #endregion
  
  // 안전한 데이터 처리
  const safeGrowthData = Array.isArray(growthData) ? growthData : [];
  
  if (safeGrowthData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">성장 추이</h2>
        <p className="text-gray-600 dark:text-gray-400">성장 데이터가 없습니다.</p>
      </div>
    );
  }

  const chartData = safeGrowthData
    .slice()
    .reverse()
    .map((data) => {
      try {
        const date = data.date instanceof Date ? data.date : new Date(data.date);
        const subscriberCount = typeof data.subscriberCount === 'number' 
          ? data.subscriberCount 
          : Number(data.subscriberCount) || 0;
        const viewCount = typeof data.viewCount === 'number' 
          ? data.viewCount 
          : Number(data.viewCount) || 0;
        
        return {
          date: format(date, "MM/dd"),
          구독자: subscriberCount,
          조회수: Math.floor(viewCount / 10000), // 만 단위로 변환
        };
      } catch (error) {
        return {
          date: "N/A",
          구독자: 0,
          조회수: 0,
        };
      }
    })
    .filter(item => item.date !== "N/A");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">성장 추이</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="구독자"
            stroke="#8884d8"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="조회수"
            stroke="#82ca9d"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

