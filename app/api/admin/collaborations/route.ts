import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collaborations = await prisma.collaborationInquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(collaborations);
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      response,
    } = body;

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
        response: response || null,
        respondedAt: response ? new Date() : null,
      },
    });

    return NextResponse.json(collaboration, { status: 201 });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration" },
      { status: 500 }
    );
  }
}

