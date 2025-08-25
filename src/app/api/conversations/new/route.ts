import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userPublicId } = await req.json();

    // check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            user: { publicId: { in: [session.user.publicId, userPublicId] } },
          },
        },
      },
      include: { participants: { include: { user: true } } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { user: { connect: { publicId: session.user.publicId } } },
              { user: { connect: { publicId: userPublicId } } },
            ],
          },
        },
        include: { participants: { include: { user: true } } },
      });
    }

    return NextResponse.json({
      publicId: conversation.publicId,
      participants: conversation.participants.map((p) => p.user),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt,
    });
  } catch (err) {
    console.error("Error creating conversation:", err);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
