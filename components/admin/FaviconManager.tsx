"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

async function fetchFaviconConfig() {
  const response = await fetch("/api/admin/favicon");
  if (!response.ok) return null;
  return response.json();
}

async function updateFaviconConfig(data: any) {
  const response = await fetch("/api/admin/favicon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) throw new Error("업데이트 실패");
  return response.json();
}

async function uploadFile(file: File, type: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "업로드 실패");
  }

  const result = await response.json();
  return result.url;
}

export function FaviconManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = {
    favicon16: useRef<HTMLInputElement>(null),
    favicon32: useRef<HTMLInputElement>(null),
    favicon48: useRef<HTMLInputElement>(null),
    appleTouchIcon: useRef<HTMLInputElement>(null),
  };

  const { data: config, isLoading } = useQuery({
    queryKey: ["favicon"],
    queryFn: fetchFaviconConfig,
  });

  const updateMutation = useMutation({
    mutationFn: updateFaviconConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favicon"] });
      alert("파비콘이 업데이트되었습니다!");
    },
    onError: (error: Error) => {
      alert(`오류: ${error.message}`);
    },
  });

  const handleFileSelect = async (type: 'favicon16' | 'favicon32' | 'favicon48' | 'appleTouchIcon', file: File) => {
    setUploading(type);
    try {
      const url = await uploadFile(file, "favicon");
      await updateMutation.mutateAsync({
        [type]: url,
      });
    } catch (error) {
      alert(`업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (type: 'favicon16' | 'favicon32' | 'favicon48' | 'appleTouchIcon', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(type, file);
    }
  };

  const handleRemove = async (type: 'favicon16' | 'favicon32' | 'favicon48' | 'appleTouchIcon') => {
    if (confirm(`${type} 파비콘을 제거하시겠습니까?`)) {
      await updateMutation.mutateAsync({
        [type]: null,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">로딩 중...</div>
      </div>
    );
  }

  const faviconSizes = [
    { key: 'favicon16' as const, label: '16x16', size: '16x16', description: '브라우저 탭 아이콘 (16x16)' },
    { key: 'favicon32' as const, label: '32x32', size: '32x32', description: '브라우저 탭 아이콘 (32x32)' },
    { key: 'favicon48' as const, label: '48x48', size: '48x48', description: '북마크 아이콘 (48x48)' },
    { key: 'appleTouchIcon' as const, label: 'Apple Touch Icon', size: '180x180', description: 'iOS 홈 화면 아이콘 (180x180)' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">파비콘 관리</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        사이트 파비콘을 업로드하고 관리하세요. 각 크기별로 최적화된 이미지를 업로드하는 것을 권장합니다.
      </p>

      <div className="space-y-6">
        {faviconSizes.map(({ key, label, size, description }) => {
          const currentUrl = config?.[key];
          const isUploading = uploading === key;

          return (
            <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">권장 크기: {size}</p>
                </div>
                {currentUrl && (
                  <button
                    onClick={() => handleRemove(key)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    disabled={isUploading || updateMutation.isPending}
                  >
                    제거
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {currentUrl ? (
                  <div className="relative w-16 h-16 border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-white dark:bg-gray-900">
                    <Image
                      src={currentUrl}
                      alt={label}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400">
                    없음
                  </div>
                )}

                <div className="flex-1">
                  <input
                    ref={fileInputRefs[key]}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                    onChange={(e) => handleFileChange(key, e)}
                    className="hidden"
                    disabled={isUploading || updateMutation.isPending}
                  />
                  <button
                    onClick={() => fileInputRefs[key].current?.click()}
                    disabled={isUploading || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "업로드 중..." : currentUrl ? "변경" : "업로드"}
                  </button>
                  {currentUrl && (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-blue-600 hover:underline"
                    >
                      미리보기
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>팁:</strong> 파비콘은 PNG, ICO, SVG 형식을 지원합니다. 
          투명 배경 PNG를 사용하면 더 깔끔한 아이콘을 만들 수 있습니다.
        </p>
      </div>
    </div>
  );
}

