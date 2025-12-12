"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes (캐시 시간 증가)
            gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5에서는 gcTime 사용)
            refetchOnWindowFocus: false,
            retry: 0, // 재시도 없음 (빠른 실패)
            refetchOnMount: false, // 마운트 시 재요청 방지
            refetchOnReconnect: false, // 재연결 시 재요청 방지
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}



