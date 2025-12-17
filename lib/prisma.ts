import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Prisma Client 검증 (개발 환경에서만)
if (process.env.NODE_ENV === "development") {
  // mainPageConfig 모델 존재 여부 확인 (런타임 체크)
  if (prisma && typeof (prisma as any).mainPageConfig === 'undefined') {
    console.warn("⚠️  Prisma Client에 mainPageConfig 모델이 없습니다.");
    console.warn("   'npx prisma generate'를 실행하고 서버를 재시작해주세요.");
  }
}



