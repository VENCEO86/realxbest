import { redirect } from "next/navigation";
import { AdBuilder } from "@/components/admin/AdBuilder";
import { AdList } from "@/components/admin/AdList";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function AdsAdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">광고 관리자</h1>
        <p className="text-gray-600 dark:text-gray-400">
          광고를 생성하고 관리하세요
        </p>
      </div>

      <AdminNav />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdBuilder />
        </div>
        <div>
          <AdList />
        </div>
      </div>
    </div>
  );
}

