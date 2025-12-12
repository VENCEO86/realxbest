import { redirect } from "next/navigation";
import { CollaborationBuilder } from "@/components/admin/CollaborationBuilder";
import { CollaborationList } from "@/components/admin/CollaborationList";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function CollaborationsAdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">협업문의 관리자</h1>
        <p className="text-gray-600 dark:text-gray-400">
          협업문의 템플릿을 생성하고 관리하세요
        </p>
      </div>

      <AdminNav />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CollaborationBuilder />
        </div>
        <div>
          <CollaborationList />
        </div>
      </div>
    </div>
  );
}

