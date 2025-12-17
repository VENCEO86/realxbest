import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { MainPageManager } from "@/components/admin/MainPageManager";

export const dynamic = 'force-dynamic';

export default async function MainPageAdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">메인 페이지 설정</h1>
        <p className="text-gray-600 dark:text-gray-400">
          메인 페이지의 제목과 설명을 관리하세요
        </p>
      </div>

      <AdminNav />

      <MainPageManager />
    </div>
  );
}

