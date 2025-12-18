import { prisma } from "./prisma";

export async function getFaviconConfig() {
  try {
    const config = await prisma.faviconConfig.findFirst({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
    });
    return config;
  } catch (error) {
    console.error("Error fetching favicon config:", error);
    return null;
  }
}


