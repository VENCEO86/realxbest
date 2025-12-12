"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchCollaborations() {
  const response = await fetch("/api/admin/collaborations", {
    credentials: "include",
  });
  if (!response.ok) return [];
  return response.json();
}

const TYPE_LABELS: Record<string, string> = {
  partnership: "파트너십",
  advertising: "광고 문의",
  content: "콘텐츠 협업",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "대기중",
  "in-progress": "진행중",
  completed: "완료",
  archived: "보관",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

export function CollaborationList() {
  const { data: collaborations = [], isLoading } = useQuery({
    queryKey: ["admin-collaborations"],
    queryFn: fetchCollaborations,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">협업문의 목록</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {collaborations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                  협업문의가 없습니다.
                </td>
              </tr>
            ) : (
              collaborations.map((inquiry: any) => (
                <tr
                  key={inquiry.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{inquiry.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {inquiry.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {inquiry.company || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {TYPE_LABELS[inquiry.type] || inquiry.type}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{inquiry.subject}</div>
                    {inquiry.message && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {inquiry.message.substring(0, 50)}...
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        STATUS_COLORS[inquiry.status] || STATUS_COLORS.pending
                      }`}
                    >
                      {STATUS_LABELS[inquiry.status] || inquiry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


