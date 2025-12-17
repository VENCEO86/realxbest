"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/collaborations", label: "협업문의" },
    { href: "/admin/ads", label: "광고관리" },
    { href: "/admin/pixels", label: "픽셀관리" },
    { href: "/admin/favicon", label: "파비콘관리" },
    { href: "/admin/seo", label: "SEO관리" },
    { href: "/admin/main-page", label: "메인페이지설정" },
  ];

  return (
    <nav className="mb-8 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`px-4 py-3 whitespace-nowrap text-sm md:text-base font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


