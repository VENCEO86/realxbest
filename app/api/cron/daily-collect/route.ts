/**
 * 데일리 자동 수집 API 엔드포인트
 * Render Cron Job에서 호출
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // 보안: Render Cron Job에서만 호출 가능하도록 API 키 확인
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET || "your-secret-token";
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    console.log("🚀 데일리 자동 수집 시작...");
    
    // DB 설정 먼저 실행
    console.log("📋 데이터베이스 설정 중...");
    await execAsync("tsx scripts/setup-db-auto.ts");
    
    // 채널 수집 실행
    console.log("📊 채널 수집 시작...");
    const { stdout, stderr } = await execAsync("tsx scripts/daily-auto-collect.ts");
    
    return NextResponse.json({
      success: true,
      message: "데일리 수집 완료",
      output: stdout,
      error: stderr || null,
    });
    
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        output: error.stdout || null,
        stderr: error.stderr || null,
      },
      { status: 500 }
    );
  }
}


