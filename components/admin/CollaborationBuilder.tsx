"use client";

import { useState } from "react";

const INQUIRY_TYPES = [
  { value: "partnership", label: "파트너십" },
  { value: "advertising", label: "광고 문의" },
  { value: "content", label: "콘텐츠 협업" },
  { value: "other", label: "기타" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "대기중" },
  { value: "in-progress", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "archived", label: "보관" },
];

export function CollaborationBuilder() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
    type: "partnership",
    status: "pending",
    response: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const inquiryData = {
      name: formData.name,
      email: formData.email,
      company: formData.company || null,
      phone: formData.phone || null,
      subject: formData.subject,
      message: formData.message,
      type: formData.type,
      status: formData.status,
      response: formData.response || null,
    };

    try {
      const response = await fetch("/api/admin/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiryData),
        credentials: "include",
      });

      if (response.ok) {
        alert("협업문의가 생성되었습니다!");
        setFormData({
          name: "",
          email: "",
          company: "",
          phone: "",
          subject: "",
          message: "",
          type: "partnership",
          status: "pending",
          response: "",
        });
      } else {
        const errorText = await response.text();
        alert(`협업문의 생성에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error("Error creating collaboration inquiry:", error);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">협업문의 템플릿 생성</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">이름 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">이메일 *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">회사명</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">전화번호</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">문의 유형 *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {INQUIRY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">제목 *</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">내용 *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={8}
            required
            placeholder="협업 문의 내용을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">상태</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">응답 내용</label>
          <textarea
            value={formData.response}
            onChange={(e) => setFormData({ ...formData, response: e.target.value })}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={6}
            placeholder="응답 내용을 입력하세요 (선택사항)"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          협업문의 생성
        </button>
      </form>
    </div>
  );
}


