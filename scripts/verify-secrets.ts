/**
 * GitHub Secrets 값 검증 스크립트
 * 로컬에서 실행하여 Secrets 값 형식 확인
 */

// DATABASE_URL 형식 검증
function validateDatabaseUrl(url: string | undefined): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: "DATABASE_URL이 설정되지 않았습니다." };
  }

  // PostgreSQL 연결 문자열 형식 확인
  // 형식: postgresql://[user[:password]@][host][:port][/database][?param1=value1&...]
  // 또는: postgres://[user[:password]@][host][:port][/database][?param1=value1&...]
  
  const postgresPattern = /^postgres(ql)?:\/\//i;
  if (!postgresPattern.test(url)) {
    return { 
      valid: false, 
      error: "DATABASE_URL 형식이 올바르지 않습니다. 'postgresql://' 또는 'postgres://'로 시작해야 합니다." 
    };
  }

  // @ 기호 확인 (사용자 정보 포함 여부)
  if (!url.includes("@")) {
    return { 
      valid: false, 
      error: "DATABASE_URL에 사용자 정보가 없습니다. 형식: postgresql://user:password@host:port/database" 
    };
  }

  // 데이터베이스 이름 확인
  const dbNameMatch = url.match(/\/([^?\/]+)(\?|$)/);
  if (!dbNameMatch) {
    return { 
      valid: false, 
      error: "DATABASE_URL에 데이터베이스 이름이 없습니다." 
    };
  }

  return { valid: true };
}

// YOUTUBE_API_KEYS 형식 검증
function validateYouTubeApiKeys(keys: string | undefined): { valid: boolean; error?: string; keyCount?: number } {
  if (!keys) {
    return { valid: false, error: "YOUTUBE_API_KEYS가 설정되지 않았습니다." };
  }

  // 빈 문자열 확인
  if (keys.trim().length === 0) {
    return { valid: false, error: "YOUTUBE_API_KEYS가 비어있습니다." };
  }

  // 쉼표로 구분된 키들 분리
  const keyArray = keys.split(",").map(k => k.trim()).filter(k => k.length > 0);
  
  if (keyArray.length === 0) {
    return { valid: false, error: "YOUTUBE_API_KEYS에 유효한 키가 없습니다." };
  }

  // 각 키 형식 확인 (YouTube API 키는 보통 39자)
  const invalidKeys: string[] = [];
  keyArray.forEach((key, index) => {
    if (key.length < 30 || key.length > 50) {
      invalidKeys.push(`키 ${index + 1} (길이: ${key.length})`);
    }
    // YouTube API 키는 보통 알파벳, 숫자, 하이픈, 언더스코어로 구성
    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      invalidKeys.push(`키 ${index + 1} (잘못된 문자 포함)`);
    }
  });

  if (invalidKeys.length > 0) {
    return { 
      valid: false, 
      error: `다음 키들이 형식이 올바르지 않습니다: ${invalidKeys.join(", ")}` 
    };
  }

  return { valid: true, keyCount: keyArray.length };
}

// 메인 검증 함수
function verifySecrets() {
  console.log("🔍 GitHub Secrets 값 검증 시작...\n");

  const databaseUrl = process.env.DATABASE_URL;
  const youtubeApiKeys = process.env.YOUTUBE_API_KEYS;

  // DATABASE_URL 검증
  console.log("📊 DATABASE_URL 검증:");
  const dbResult = validateDatabaseUrl(databaseUrl);
  if (dbResult.valid) {
    console.log("  ✅ DATABASE_URL 형식이 올바릅니다.");
    // 민감 정보 노출 방지를 위해 일부만 표시
    const maskedUrl = databaseUrl!.replace(/:([^:@]+)@/, ":****@");
    console.log(`  📝 형식: ${maskedUrl.substring(0, 50)}...`);
  } else {
    console.log(`  ❌ ${dbResult.error}`);
  }

  console.log("");

  // YOUTUBE_API_KEYS 검증
  console.log("📊 YOUTUBE_API_KEYS 검증:");
  const apiKeysResult = validateYouTubeApiKeys(youtubeApiKeys);
  if (apiKeysResult.valid) {
    console.log(`  ✅ YOUTUBE_API_KEYS 형식이 올바릅니다.`);
    console.log(`  📝 키 개수: ${apiKeysResult.keyCount}개`);
    // 각 키의 일부만 표시
    const keyArray = youtubeApiKeys!.split(",").map(k => k.trim());
    keyArray.forEach((key, index) => {
      const maskedKey = key.substring(0, 10) + "..." + key.substring(key.length - 5);
      console.log(`  📝 키 ${index + 1}: ${maskedKey}`);
    });
  } else {
    console.log(`  ❌ ${apiKeysResult.error}`);
  }

  console.log("");

  // 최종 결과
  if (dbResult.valid && apiKeysResult.valid) {
    console.log("✅ 모든 Secrets 값이 올바른 형식입니다!");
    return 0;
  } else {
    console.log("❌ 일부 Secrets 값에 문제가 있습니다. 위의 에러 메시지를 확인하세요.");
    return 1;
  }
}

// 실행
if (require.main === module) {
  const exitCode = verifySecrets();
  process.exit(exitCode);
}

export { validateDatabaseUrl, validateYouTubeApiKeys };


