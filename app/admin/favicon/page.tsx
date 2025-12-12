import { redirect } from "next/navigation";
import { FaviconManager } from "@/components/admin/FaviconManager";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function FaviconAdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">파비콘 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          사이트 파비콘을 업로드하고 관리하세요
        </p>
      </div>

      <AdminNav />

      <FaviconManager />
    </div>
  );
}

