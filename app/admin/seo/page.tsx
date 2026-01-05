import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function SEOAdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SEO 및 미리보기 이미지 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          페이지별 SEO 설정과 Open Graph 이미지를 관리하세요
        </p>
      </div>

      <AdminNav />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          SEO 관리 기능은 현재 개발 중입니다.
        </p>
      </div>
    </div>
  );
}


