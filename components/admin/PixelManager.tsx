"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchPixels() {
  const response = await fetch("/api/admin/pixels", {
    credentials: "include", // 쿠키 포함
  });
  if (!response.ok) return [];
  return response.json();
}

export function PixelManager() {
  const [formData, setFormData] = useState({
    name: "",
    type: "facebook",
    code: "",
  });

  const { data: pixels = [], refetch } = useQuery({
    queryKey: ["pixels"],
    queryFn: fetchPixels,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          events: [],
          status: "active",
        }),
        credentials: "include", // 쿠키 포함
      });
      if (response.ok) {
        alert("픽셀이 생성되었습니다!");
        setFormData({ name: "", type: "facebook", code: "" });
        refetch();
      } else {
        const errorText = await response.text();
        alert(`픽셀 생성에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error("Error creating pixel:", error);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">픽셀 생성</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">픽셀 이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">픽셀 타입</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
            >
              <option value="facebook">Facebook Pixel</option>
              <option value="google">Google Analytics</option>
              <option value="google-tag-manager">Google Tag Manager</option>
              <option value="custom">커스텀 픽셀</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">픽셀 코드</label>
            <textarea
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              rows={10}
              required
              placeholder="픽셀 코드를 입력하세요"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            픽셀 생성
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">픽셀 목록</h2>
        <div className="space-y-4">
          {pixels.length === 0 ? (
            <p className="text-gray-600">픽셀이 없습니다.</p>
          ) : (
            pixels.map((pixel: any) => (
              <div key={pixel.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{pixel.name}</h3>
                    <p className="text-sm text-gray-600">{pixel.type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      pixel.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {pixel.status === "active" ? "활성" : "일시정지"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

