"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminAuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 인증 상태 확인
    fetch("/api/admin/check-auth", {
      credentials: "include", // 쿠키 포함
    })
      .then((res) => {
        // 200 OK인 경우에만 JSON 파싱
        if (!res.ok) {
          return { authenticated: false };
        }
        return res.json();
      })
      .then((data) => {
        setIsAuthenticated(data?.authenticated || false);
      })
      .catch((err) => {
        // 네트워크 오류 등은 무시하고 인증되지 않은 것으로 처리
        console.debug('[AdminAuthButton] 인증 확인 실패 (정상일 수 있음):', err);
        setIsAuthenticated(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { 
        method: "POST",
        credentials: "include"
      });
      setIsAuthenticated(false);
      await router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isAuthenticated === null) {
    // 로딩 중
    return null;
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
        <Link
          href="/admin/collaborations"
          prefetch={true}
          className="px-3 py-2 md:px-4 md:py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer whitespace-nowrap text-sm md:text-base"
        >
          협업문의
        </Link>
        <Link
          href="/admin/ads"
          prefetch={true}
          className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer whitespace-nowrap text-sm md:text-base"
        >
          광고관리
        </Link>
        <button
          onClick={handleLogout}
          className="px-3 py-2 md:px-4 md:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 whitespace-nowrap text-sm md:text-base"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/admin/login"
      prefetch={true}
      className="px-3 py-2 md:px-4 md:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer whitespace-nowrap text-sm md:text-base"
    >
      로그인
    </Link>
  );
}

