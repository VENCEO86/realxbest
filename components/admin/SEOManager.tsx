"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

const PAGES = [
  { value: "/", label: "홈" },
  { value: "/rankings", label: "랭킹" },
  { value: "/categories", label: "카테고리" },
  { value: "/search", label: "검색" },
  { value: "/trends", label: "트렌드" },
];

async function fetchSEOConfig(page: string) {
  const response = await fetch(`/api/admin/seo?page=${encodeURIComponent(page)}`);
  if (!response.ok) return null;
  return response.json();
}

async function updateSEOConfig(data: any) {
  const response = await fetch("/api/admin/seo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) throw new Error("업데이트 실패");
  return response.json();
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "og-image");

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

export function SEOManager() {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState("/");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["seo", selectedPage],
    queryFn: () => fetchSEOConfig(selectedPage),
  });

  const updateMutation = useMutation({
    mutationFn: updateSEOConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo", selectedPage] });
      alert("SEO 설정이 업데이트되었습니다!");
    },
    onError: (error: Error) => {
      alert(`오류: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    canonicalUrl: "",
  });

  // config가 로드되면 formData 업데이트
  useEffect(() => {
    if (config) {
      setFormData({
        title: config.title || "",
        description: config.description || "",
        keywords: Array.isArray(config.keywords) ? config.keywords.join(", ") : config.keywords || "",
        ogTitle: config.ogTitle || "",
        ogDescription: config.ogDescription || "",
        ogImage: config.ogImage || "",
        twitterCard: config.twitterCard || "summary_large_image",
        canonicalUrl: config.canonicalUrl || "",
      });
    }
  }, [config]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(file);
      setFormData({ ...formData, ogImage: url });
      await updateMutation.mutateAsync({
        page: selectedPage,
        ogImage: url,
      });
    } catch (error) {
      alert(`업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      page: selectedPage,
      title: formData.title,
      description: formData.description,
      keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k),
      ogTitle: formData.ogTitle || formData.title,
      ogDescription: formData.ogDescription || formData.description,
      ogImage: formData.ogImage,
      twitterCard: formData.twitterCard,
      canonicalUrl: formData.canonicalUrl,
    });
  };

  const handleRemoveImage = async () => {
    if (confirm("OG 이미지를 제거하시겠습니까?")) {
      await updateMutation.mutateAsync({
        page: selectedPage,
        ogImage: null,
      });
      setFormData({ ...formData, ogImage: "" });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">SEO 및 미리보기 이미지 관리</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        페이지별 SEO 설정과 Open Graph 이미지를 관리하세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">페이지 선택</label>
          <select
            value={selectedPage}
            onChange={(e) => {
              setSelectedPage(e.target.value);
              queryClient.invalidateQueries({ queryKey: ["seo"] });
            }}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {PAGES.map((page) => (
              <option key={page.value} value={page.value}>
                {page.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">페이지 제목 (Title)</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="페이지 제목"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">메타 설명 (Description)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={3}
            placeholder="페이지 설명"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">키워드 (쉼표로 구분)</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="키워드1, 키워드2, 키워드3"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4">Open Graph 설정</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">OG 제목</label>
            <input
              type="text"
              value={formData.ogTitle}
              onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="페이지 제목과 동일하면 비워두세요"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">OG 설명</label>
            <textarea
              value={formData.ogDescription}
              onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder="메타 설명과 동일하면 비워두세요"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">OG 이미지 (미리보기 이미지)</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              권장 크기: 1200x630px (소셜 미디어 공유 시 표시되는 이미지)
            </p>
            
            {formData.ogImage ? (
              <div className="mb-4">
                <div className="relative w-full max-w-md h-64 border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-gray-100 dark:bg-gray-900 mb-2">
                  <Image
                    src={formData.ogImage}
                    alt="OG Image Preview"
                    fill
                    className="object-cover"
                    sizes="512px"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    disabled={uploading || updateMutation.isPending}
                  >
                    이미지 제거
                  </button>
                  <a
                    href={formData.ogImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    미리보기
                  </a>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 mb-2">
                  이미지 없음
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading || updateMutation.isPending}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "업로드 중..." : formData.ogImage ? "이미지 변경" : "이미지 업로드"}
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Twitter Card 타입</label>
            <select
              value={formData.twitterCard}
              onChange={(e) => setFormData({ ...formData, twitterCard: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Canonical URL</label>
            <input
              type="url"
              value={formData.canonicalUrl}
              onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://example.com/page"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? "저장 중..." : "SEO 설정 저장"}
        </button>
      </form>
    </div>
  );
}

