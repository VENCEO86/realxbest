/**
 * 단일 국가 채널 수집 스크립트
 * 사용법: npx tsx scripts/collect-single-country.ts KR
 * 
 * 참고: 이 스크립트는 collect-priority-countries.ts의 함수를 사용합니다.
 *       단일 국가만 수집하려면 collect-priority-countries.ts를 직접 수정하거나
 *       해당 파일의 collectPriorityCountry 함수를 import하여 사용하세요.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.error("❌ 이 스크립트는 현재 사용할 수 없습니다.");
  console.error("   대신 collect-priority-countries.ts를 사용하거나,");
  console.error("   collectPriorityCountry 함수를 export하여 사용하세요.");
  process.exit(1);
}

main().catch(console.error);

