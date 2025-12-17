import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

// GET: 메인 페이지 설정 조회
export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 단일 설정 조회 (id가 'default'로 고정)
    let config;
    try {
      config = await (prisma as any).mainPageConfig?.findUnique({
        where: { id: "default" },
      });
      
      // 모델이 없는 경우 기본값 반환
      if (!config && (prisma as any).mainPageConfig) {
        return NextResponse.json({
          id: "default",
          title: "유튜브 순위 TOP 100",
          description: "실시간 유튜브 채널 랭킹 및 분석",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (modelError: any) {
      // Prisma 모델이 없는 경우 기본값 반환
      console.warn("⚠️  Prisma 모델 접근 오류:", modelError);
      return NextResponse.json({
        id: "default",
        title: "유튜브 순위 TOP 100",
        description: "실시간 유튜브 채널 랭킹 및 분석",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // 설정이 없으면 기본값 반환 (생성하지 않음 - GET은 조회만)
    if (!config) {
      return NextResponse.json({
        id: "default",
        title: "유튜브 순위 TOP 100",
        description: "실시간 유튜브 채널 랭킹 및 분석",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Error fetching main page config:", error);
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || "UNKNOWN";
    
    // Prisma 모델이 없을 경우 기본값 반환
    if (errorMessage.includes("mainPageConfig") || errorMessage.includes("does not exist") || errorCode === "P2025") {
      console.warn("MainPageConfig 모델이 데이터베이스에 없습니다. 기본값을 반환합니다.");
      return NextResponse.json({
        id: "default",
        title: "유튜브 순위 TOP 100",
        description: "실시간 유튜브 채널 랭킹 및 분석",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch config",
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}

// POST: 메인 페이지 설정 업데이트
export async function POST(request: NextRequest) {
  // 변수를 상위 스코프에 선언 (catch 블록에서 사용하기 위해)
  let title: string | undefined;
  let description: string | undefined;
  
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    title = body.title;
    description = body.description;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // 기존 설정 찾기 (다른 관리자 API와 동일한 패턴)
    // try-catch로 감싸서 Prisma 모델 오류를 명확히 처리
    let existing;
    try {
      existing = await prisma.mainPageConfig.findUnique({
        where: { id: "default" },
      });
    } catch (modelError: any) {
      // Prisma 모델이 없는 경우 명확한 오류 메시지
      console.error("❌ Prisma 모델 접근 오류:", modelError);
      const errorMessage = modelError?.message || String(modelError);
      
      if (errorMessage.includes("mainPageConfig") || errorMessage.includes("Cannot read") || errorMessage.includes("undefined")) {
        return NextResponse.json(
          {
            error: "Prisma 모델 오류",
            details: "mainPageConfig 모델을 찾을 수 없습니다. 서버를 재시작하거나 'npx prisma generate'를 실행해주세요.",
            code: "MODEL_NOT_FOUND",
            hint: "다른 관리자 API(favicon, seo)는 정상 작동하므로 Prisma Client 재생성 필요"
          },
          { status: 500 }
        );
      }
      throw modelError; // 다른 오류는 그대로 throw
    }

    let config;
    if (existing) {
      // 기존 설정 업데이트
      config = await prisma.mainPageConfig.update({
        where: { id: "default" },
        data: {
          title,
          description,
        },
      });
    } else {
      // 새 설정 생성
      config = await prisma.mainPageConfig.create({
        data: {
          id: "default",
          title,
          description,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("❌ Error updating main page config:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error meta:", error?.meta);
    
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || "UNKNOWN";
    const errorStack = error?.stack || "";
    
    // 더 구체적인 에러 메시지 생성
    let userFriendlyMessage = "설정 저장 중 오류가 발생했습니다.";
    
    // Prisma 에러 코드별 처리
    if (errorCode === "P2025" || errorMessage.includes("Record to update not found")) {
      // 레코드를 찾을 수 없으면 생성 시도
      if (title && description) {
        console.log("레코드를 찾을 수 없음. 새로 생성 시도...");
        try {
          const newConfig = await (prisma as any).mainPageConfig?.create({
            data: {
              id: "default",
              title,
              description,
            },
          });
          console.log("✅ 새 레코드 생성 성공:", newConfig);
          return NextResponse.json(newConfig);
        } catch (createError: any) {
          console.error("❌ 생성 실패:", createError);
          userFriendlyMessage = `데이터베이스 오류: ${createError?.message || "레코드를 생성할 수 없습니다"}`;
        }
      }
    } else if (errorCode === "P1001" || errorMessage.includes("Can't reach database server") || errorMessage.includes("connect")) {
      userFriendlyMessage = "데이터베이스 연결 오류입니다. DATABASE_URL을 확인해주세요.";
    } else if (errorCode === "P1012" || errorMessage.includes("postgresql://") || errorMessage.includes("postgres://")) {
      userFriendlyMessage = "DATABASE_URL 형식 오류입니다. postgresql:// 또는 postgres://로 시작해야 합니다.";
    } else if (errorMessage.includes("mainPageConfig") || errorMessage.includes("does not exist") || errorMessage.includes("Unknown model") || errorCode === "P2001") {
      userFriendlyMessage = "데이터베이스 테이블이 없습니다. Prisma 마이그레이션을 실행해주세요: npx prisma db push";
    } else if (errorCode === "P2002" || errorMessage.includes("Unique constraint")) {
      userFriendlyMessage = "이미 설정이 존재합니다. 다시 시도해주세요.";
    } else {
      // 일반적인 에러 메시지 사용
      userFriendlyMessage = errorMessage;
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyMessage,
        details: errorMessage,
        code: errorCode,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

