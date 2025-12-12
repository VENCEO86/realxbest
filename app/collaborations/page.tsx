import { CollaborationForm } from "@/components/collaborations/CollaborationForm";

export const dynamic = 'force-dynamic';

export default function CollaborationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">협업문의</h1>
          <p className="text-gray-600 dark:text-gray-400">
            KorYouTube와의 협업을 원하시나요? 아래 양식을 작성해주세요.
          </p>
        </div>

        <CollaborationForm />
      </div>
    </div>
  );
}


