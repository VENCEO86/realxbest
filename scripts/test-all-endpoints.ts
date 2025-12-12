/**
 * 모든 API 엔드포인트 전수조사 및 테스트 스크립트
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  responseTime?: number;
  dataSize?: number;
}

const testResults: TestResult[] = [];

/**
 * API 엔드포인트 테스트
 */
async function testEndpoint(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;

  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let dataSize = 0;
    try {
      const data = await response.json();
      dataSize = JSON.stringify(data).length;
    } catch {
      // JSON 파싱 실패 시 무시
    }

    return {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      responseTime,
      dataSize,
    };
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * 모든 엔드포인트 테스트
 */
async function testAllEndpoints() {
  console.log("🔍 API 엔드포인트 전수조사 시작...\n");

  const endpoints = [
    // 메인 API
    { path: "/api/rankings", method: "GET", params: "?page=1&limit=50" },
    { path: "/api/rankings", method: "GET", params: "?country=KR&page=1&limit=50" },
    { path: "/api/rankings", method: "GET", params: "?country=JP&page=1&limit=50" },
    { path: "/api/rankings", method: "GET", params: "?country=PL&page=1&limit=50" },
    { path: "/api/rankings", method: "GET", params: "?category=entertainment&page=1&limit=50" },
    
    // 채널 상세
    { path: "/api/channels/UC-lHJZR3Gqxm24_Vd_AJ5Yw", method: "GET" },
    
    // 검색
    { path: "/api/search", method: "GET", params: "?q=pewdiepie" },
    { path: "/api/search", method: "GET", params: "?q=한국" },
    
    // 트렌드
    { path: "/api/trends", method: "GET" },
    
    // 광고
    { path: "/api/ads/active", method: "GET", params: "?page=/&location=header" },
    
    // 픽셀
    { path: "/api/pixels/active", method: "GET" },
  ];

  for (const endpoint of endpoints) {
    const fullPath = endpoint.path + (endpoint.params || "");
    console.log(`테스트 중: ${endpoint.method} ${fullPath}`);
    
    const result = await testEndpoint(fullPath, endpoint.method);
    testResults.push(result);

    if (result.success) {
      console.log(`  ✅ 성공 (${result.status}) - ${result.responseTime}ms - ${(result.dataSize || 0) / 1024}KB\n`);
    } else {
      console.log(`  ❌ 실패 (${result.status}) - ${result.error || "Unknown error"}\n`);
    }

    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 결과 요약
  console.log("\n📊 테스트 결과 요약:");
  console.log(`  총 테스트: ${testResults.length}개`);
  console.log(`  성공: ${testResults.filter(r => r.success).length}개`);
  console.log(`  실패: ${testResults.filter(r => !r.success).length}개`);
  console.log(`  평균 응답 시간: ${Math.round(testResults.filter(r => r.responseTime).reduce((sum, r) => sum + (r.responseTime || 0), 0) / testResults.filter(r => r.responseTime).length)}ms`);

  // 실패한 엔드포인트
  const failed = testResults.filter(r => !r.success);
  if (failed.length > 0) {
    console.log("\n❌ 실패한 엔드포인트:");
    failed.forEach(r => {
      console.log(`  ${r.method} ${r.endpoint} - ${r.error || `Status: ${r.status}`}`);
    });
  }

  return testResults.every(r => r.success);
}

/**
 * 메인 실행
 */
async function main() {
  try {
    const allPassed = await testAllEndpoints();
    
    if (allPassed) {
      console.log("\n✅ 모든 API 엔드포인트 테스트 통과!");
      process.exit(0);
    } else {
      console.log("\n⚠️ 일부 API 엔드포인트 테스트 실패");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ 테스트 실행 오류:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { testAllEndpoints };



