"use client";

import { useState } from "react";

const AD_TYPES = [
  { value: "banner", label: "배너 광고" },
  { value: "native", label: "네이티브 광고" },
  { value: "pixel", label: "픽셀 광고" },
  { value: "infeed", label: "인피드 광고" },
  { value: "sticky", label: "스티키 광고" },
];

const PAGES = [
  { value: "all", label: "전체 페이지" },
  { value: "home", label: "홈" },
  { value: "ranking", label: "랭킹" },
  { value: "channel", label: "채널 상세" },
  { value: "category", label: "카테고리" },
  { value: "search", label: "검색" },
];

const LOCATIONS = [
  { value: "header", label: "헤더" },
  { value: "sidebar", label: "사이드바" },
  { value: "content-top", label: "콘텐츠 상단" },
  { value: "content-middle", label: "콘텐츠 중간" },
  { value: "content-bottom", label: "콘텐츠 하단" },
  { value: "footer", label: "푸터" },
  { value: "sticky", label: "스티키" },
];

export function AdBuilder() {
  const [formData, setFormData] = useState({
    name: "",
    type: "banner",
    content: "",
    page: "all",
    location: "content-top",
    priority: 0,
    status: "paused",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const adData = {
      name: formData.name,
      type: formData.type,
      content: formData.content,
      position: {
        page: formData.page,
        location: formData.location,
        priority: formData.priority,
      },
      displayConditions: {},
      schedule: {
        startDate: new Date().toISOString(),
        endDate: null,
      },
      frequency: {
        maxPerDay: 10,
        maxPerSession: 3,
      },
      status: formData.status,
    };

    try {
      const response = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adData),
        credentials: "include", // 쿠키 포함
      });

      if (response.ok) {
        alert("광고가 생성되었습니다!");
        setFormData({
          name: "",
          type: "banner",
          content: "",
          page: "all",
          location: "content-top",
          priority: 0,
          status: "paused",
        });
      } else {
        const errorText = await response.text();
        alert(`광고 생성에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">광고 생성</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">광고 이름</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">광고 타입</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {AD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">페이지</label>
          <select
            value={formData.page}
            onChange={(e) => setFormData({ ...formData, page: e.target.value })}
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
          <label className="block text-sm font-medium mb-2">위치</label>
          <select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {LOCATIONS.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">우선순위</label>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {formData.type === "pixel" ? "픽셀 코드" : "광고 내용 (HTML)"}
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={10}
            required
            placeholder={
              formData.type === "pixel"
                ? "픽셀 코드를 입력하세요"
                : "HTML 코드를 입력하세요"
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">상태</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="active">활성</option>
            <option value="paused">일시정지</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          광고 생성
        </button>
      </form>
    </div>
  );
}

