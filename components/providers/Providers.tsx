"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (캐시 시간 증가)
            gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5에서는 gcTime 사용)
            refetchOnWindowFocus: false,
            retry: 1, // 재시도 1회만
            retryDelay: 500, // 0.5초 후 재시도 (빠른 재시도)
            refetchOnMount: false, // 마운트 시 재요청 방지
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}



