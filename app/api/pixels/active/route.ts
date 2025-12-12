import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pixels = await prisma.pixel.findMany({
      where: {
        status: "active",
      },
    });

    return NextResponse.json({ pixels });
  } catch (error) {
    console.error("Error fetching active pixels:", error);
    return NextResponse.json({ pixels: [] });
  }
}

