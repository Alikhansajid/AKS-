import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getServerSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession(req);
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { publicId: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                publicId: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(
      conversation.messages.map((m) => ({
        ...m,
        content: m.text,
      }))
    );
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession(req);
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const { conversationId } = await params;

    const sender = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
    });

    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { publicId: conversationId },
      include: { participants: { include: { user: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!conversation.participants.some((p) => p.user.publicId === sender.publicId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        publicId: uuidv4(),
        text: content,
        conversation: { connect: { publicId: conversationId } },
        sender: { connect: { id: sender.id } },
      },
      include: {
        sender: {
          select: {
            publicId: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { publicId: conversationId },
      data: { updatedAt: new Date() },
    });

    const formattedMessage = {
      publicId: message.publicId,
      conversationPublicId: conversationId,
      sender: message.sender,
      content: message.text,
      createdAt: message.createdAt.toISOString(),
    };

    try {
      const io = getServerSocket();
      conversation.participants.forEach((p) => {
        io.to(p.user.publicId).emit("message:active", formattedMessage);
        io.to(p.user.publicId).emit("message:sidebar", formattedMessage);
      });
      io.to(conversationId).emit("message:active", formattedMessage);
    } catch (e) {
      console.error("Failed to emit Socket.IO events:", e);
    }

    return NextResponse.json(formattedMessage);
  } catch (err) {
    console.error("Error creating message:", err);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}