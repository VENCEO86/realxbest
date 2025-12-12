"use client";

export function TrendReport() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">주간 트렌드 리포트</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">주요 인사이트</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>엔터테인먼트 카테고리가 가장 높은 성장률을 보이고 있습니다.</li>
            <li>음악 카테고리의 평균 참여율이 전 주 대비 5% 증가했습니다.</li>
            <li>게임 카테고리에서 신규 채널이 많이 진입했습니다.</li>
          </ul>
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            리포트 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}


