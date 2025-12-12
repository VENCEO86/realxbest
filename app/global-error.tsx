"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {

    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600">심각한 오류가 발생했습니다</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || "알 수 없는 오류가 발생했습니다."}
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 mb-8">오류 ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}

