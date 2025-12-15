/**
 * GitHub Secrets 값 검증 스크립트
 * GitHub Actions에서 실행될 때 환경 변수 확인
 */

console.log("🔍 GitHub Secrets 값 검증 시작...\n");

// DATABASE_URL 검증
const databaseUrl = process.env.DATABASE_URL;
console.log("📊 DATABASE_URL 검증:");
if (!databaseUrl) {
  console.log("  ❌ DATABASE_URL이 설정되지 않았습니다.");
  process.exit(1);
}

// 형식 검증
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  console.log("  ❌ DATABASE_URL 형식이 올바르지 않습니다.");
  console.log("     'postgresql://' 또는 'postgres://'로 시작해야 합니다.");
  process.exit(1);
}

if (!databaseUrl.includes("@")) {
  console.log("  ❌ DATABASE_URL에 사용자 정보가 없습니다.");
  console.log("     형식: postgresql://user:password@host:port/database");
  process.exit(1);
}

if (!databaseUrl.includes("/")) {
  console.log("  ❌ DATABASE_URL에 데이터베이스 이름이 없습니다.");
  process.exit(1);
}

// 포트 번호 검증
try {
  // URL 파싱 시도
  const urlPattern = /^(postgresql|postgres):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = databaseUrl.match(urlPattern);
  
  if (!match) {
    // 포트 번호가 없는 경우도 허용 (기본 포트 사용)
    const urlPatternNoPort = /^(postgresql|postgres):\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)$/;
    const matchNoPort = databaseUrl.match(urlPatternNoPort);
    
    if (!matchNoPort) {
      console.log("  ❌ DATABASE_URL 형식이 올바르지 않습니다.");
      console.log("     형식: postgresql://user:password@host:port/database");
      console.log("     또는: postgresql://user:password@host/database (기본 포트 5432 사용)");
      process.exit(1);
    }
    
    console.log("  ⚠️  포트 번호가 없습니다. 기본 포트 5432를 사용합니다.");
  } else {
    const port = parseInt(match[5], 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.log("  ❌ DATABASE_URL의 포트 번호가 올바르지 않습니다.");
      console.log(`     포트 번호: ${match[5]} (1-65535 범위여야 함)`);
      process.exit(1);
    }
    console.log(`  ✅ 포트 번호 검증 완료: ${port}`);
  }
  
  // 실제 Prisma Client로 연결 테스트
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(() => {
      console.log("  ✅ 데이터베이스 연결 테스트 성공");
      return prisma.$disconnect();
    })
    .catch((error: any) => {
      console.log("  ❌ 데이터베이스 연결 테스트 실패:");
      console.log(`     ${error.message}`);
      
      if (error.message.includes("invalid port number")) {
        console.log("\n  💡 해결 방법:");
        console.log("     - DATABASE_URL의 포트 번호를 확인하세요 (1-65535)");
        console.log("     - Render에서 External Connection String을 다시 복사하세요");
        console.log("     - 포트 번호가 숫자인지 확인하세요");
      } else if (error.message.includes("connection string")) {
        console.log("\n  💡 해결 방법:");
        console.log("     - DATABASE_URL 형식: postgresql://user:password@host:port/database");
        console.log("     - 특수문자가 있으면 URL 인코딩이 필요할 수 있습니다");
        console.log("     - Render에서 External Connection String을 다시 복사하세요");
      }
      
      process.exit(1);
    });
  
} catch (error: any) {
  console.log("  ⚠️  URL 파싱 중 오류 발생 (계속 진행):", error.message);
}

// 민감 정보 노출 방지를 위해 일부만 표시
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ":****@");
console.log("  ✅ DATABASE_URL 형식이 올바릅니다.");
console.log(`  📝 형식: ${maskedUrl.substring(0, 60)}...`);
console.log(`  📏 길이: ${databaseUrl.length}자\n`);

// YOUTUBE_API_KEYS 검증
const youtubeApiKeys = process.env.YOUTUBE_API_KEYS;
console.log("📊 YOUTUBE_API_KEYS 검증:");
if (!youtubeApiKeys) {
  console.log("  ❌ YOUTUBE_API_KEYS가 설정되지 않았습니다.");
  process.exit(1);
}

if (youtubeApiKeys.trim().length === 0) {
  console.log("  ❌ YOUTUBE_API_KEYS가 비어있습니다.");
  process.exit(1);
}

// 쉼표로 구분된 키들 분리
const keyArray = youtubeApiKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);

if (keyArray.length === 0) {
  console.log("  ❌ YOUTUBE_API_KEYS에 유효한 키가 없습니다.");
  process.exit(1);
}

// 각 키 형식 확인
const invalidKeys: string[] = [];
keyArray.forEach((key, index) => {
  if (key.length < 30 || key.length > 50) {
    invalidKeys.push(`키 ${index + 1} (길이: ${key.length})`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(key)) {
    invalidKeys.push(`키 ${index + 1} (잘못된 문자 포함)`);
  }
});

if (invalidKeys.length > 0) {
  console.log(`  ❌ 다음 키들이 형식이 올바르지 않습니다: ${invalidKeys.join(", ")}`);
  process.exit(1);
}

console.log(`  ✅ YOUTUBE_API_KEYS 형식이 올바릅니다.`);
console.log(`  📝 키 개수: ${keyArray.length}개`);
keyArray.forEach((key, index) => {
  const maskedKey = key.substring(0, 10) + "..." + key.substring(key.length - 5);
  console.log(`  📝 키 ${index + 1}: ${maskedKey} (${key.length}자)`);
});

console.log("\n✅ 모든 Secrets 값이 올바른 형식입니다!");
console.log("🚀 GitHub Actions 워크플로우 실행 준비 완료!");

