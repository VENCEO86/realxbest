import { redirect } from "next/navigation";
import { PixelManager } from "@/components/admin/PixelManager";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function PixelsPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">픽셀 광고 관리</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Facebook Pixel, Google Analytics 등 픽셀 광고를 관리하세요
        </p>
      </div>

      <AdminNav />

      <PixelManager />
    </div>
  );
}

