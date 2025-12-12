import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      phone,
      subject,
      message,
      type,
      status,
    } = body;

    // 필수 필드 검증
    if (!name || !email || !subject || !message || !type) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    const collaboration = await prisma.collaborationInquiry.create({
      data: {
        name,
        email,
        company: company || null,
        phone: phone || null,
        subject,
        message,
        type,
        status: status || "pending",
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "협업문의가 성공적으로 전송되었습니다.",
        id: collaboration.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating collaboration inquiry:", error);
    return NextResponse.json(
      { error: "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}


