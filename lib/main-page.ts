import { prisma } from "@/lib/prisma";

export async function getMainPageConfig() {
  try {
    let config = await prisma.mainPageConfig.findFirst();
    
    // 설정이 없으면 기본값 반환
    if (!config) {
      return {
        title: "유튜브 순위 TOP 100",
        description: "실시간 유튜브 채널 랭킹 및 분석",
      };
    }

    return {
      title: config.title,
      description: config.description,
    };
  } catch (error) {
    console.error("Error fetching main page config:", error);
    // 오류 시 기본값 반환
    return {
      title: "유튜브 순위 TOP 100",
      description: "실시간 유튜브 채널 랭킹 및 분석",
    };
  }
}

