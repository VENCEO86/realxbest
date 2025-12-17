"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchMainPageConfig() {
  const response = await fetch("/api/admin/main-page");
  if (!response.ok) throw new Error("Failed to fetch config");
  return response.json();
}

async function updateMainPageConfig(data: { title: string; description: string }) {
  const response = await fetch("/api/admin/main-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    // 에러 응답을 그대로 전달 (상세 정보 포함)
    const error: any = new Error(responseData.error || "Failed to update config");
    error.response = { data: responseData };
    throw error;
  }
  
  return responseData;
}

export function MainPageManager() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["mainPageConfig"],
    queryFn: fetchMainPageConfig,
  });

  useEffect(() => {
    if (config) {
      setTitle(config.title || "");
      setDescription(config.description || "");
      setPreviewTitle(config.title || "");
      setPreviewDescription(config.description || "");
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: updateMainPageConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mainPageConfig"] });
      alert("메인 페이지 설정이 업데이트되었습니다!");
    },
    onError: (error: any) => {
      console.error("MainPageManager update error:", error);
      console.error("Error details:", error?.response?.data);
      
      const responseData = error?.response?.data || {};
      const errorMessage = responseData.details || responseData.error || error?.message || "알 수 없는 오류가 발생했습니다.";
      const errorCode = responseData.code;
      
      let userMessage = "설정 저장 중 오류가 발생했습니다.";
      
      // 구체적인 에러 메시지가 있으면 우선 사용
      if (responseData.error && responseData.error !== "Failed to update config") {
        userMessage = responseData.error;
      } else if (errorMessage.includes("Database schema error") || errorMessage.includes("테이블이 없습니다") || errorMessage.includes("does not exist") || errorMessage.includes("Unknown model")) {
        userMessage = `데이터베이스 테이블이 없습니다.\n\nPrisma 마이그레이션을 실행해주세요:\n\nnpx prisma db push`;
      } else if (errorMessage.includes("connection") || errorMessage.includes("connect") || errorMessage.includes("DATABASE_URL") || errorCode === "P1001") {
        userMessage = `데이터베이스 연결 오류입니다.\n\nDATABASE_URL을 확인해주세요.\n\n오류: ${errorMessage}`;
      } else if (errorMessage.includes("postgresql://") || errorMessage.includes("postgres://")) {
        userMessage = `DATABASE_URL 형식 오류입니다.\n\npostgresql:// 또는 postgres://로 시작해야 합니다.`;
      } else if (errorMessage && errorMessage !== "Failed to update config") {
        userMessage = `${errorMessage}${errorCode ? `\n\n코드: ${errorCode}` : ""}`;
      }
      
      alert(userMessage);
    },
  });

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      alert("제목과 설명을 모두 입력해주세요.");
      return;
    }
    updateMutation.mutate({ title: title.trim(), description: description.trim() });
  };

  // 실시간 미리보기 업데이트
  useEffect(() => {
    setPreviewTitle(title.trim() || config?.title || "유튜브 순위 TOP 100");
    setPreviewDescription(description.trim() || config?.description || "실시간 유튜브 채널 랭킹 및 분석");
  }, [title, description, config]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 편집 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          메인 페이지 제목 및 설명 편집
        </h2>
        
        <div className="space-y-4">
          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="유튜브 순위 TOP 100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 설명 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="실시간 유튜브 채널 랭킹 및 분석"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>

      {/* 미리보기 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          미리보기
        </h2>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {previewTitle || title || "유튜브 순위 TOP 100"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {previewDescription || description || "실시간 유튜브 채널 랭킹 및 분석"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

