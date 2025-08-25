import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { user: { publicId: session.user.publicId } },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { publicId: true, name: true, role: true, profilePic: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { publicId: true, name: true, role: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      conversations.map((c) => ({
        publicId: c.publicId,
        participants: c.participants.map((p) => p.user),
        lastMessage: c.messages[0]
          ? {
              publicId: c.messages[0].publicId,
              conversationPublicId: c.publicId,
              sender: c.messages[0].sender,
              content: c.messages[0].text,
              createdAt: c.messages[0].createdAt,
            }
          : null,
        unreadCount: 0,
        updatedAt: c.updatedAt,
      }))
    );
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { participantPublicId } = body;

    if (!participantPublicId) {
      return NextResponse.json({ error: "participantPublicId required" }, { status: 400 });
    }

    const participant = await prisma.user.findUnique({
      where: { publicId: participantPublicId },
    });

    if (!participant) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            user: {
              publicId: { in: [session.user.publicId, participantPublicId] },
            },
          },
        },
      },
    });

    if (existing) {
      return NextResponse.json({ conversation: existing, new: false });
    }

    const conversation = await prisma.conversation.create({
      data: {
        publicId: uuidv4(),
        participants: {
          create: [
            { user: { connect: { publicId: session.user.publicId } } },
            { user: { connect: { publicId: participantPublicId } } },
          ],
        },
      },
      include: {
        participants: {
          include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
        },
      },
    });

    const formattedConversation = {
      publicId: conversation.publicId,
      participants: conversation.participants.map((p) => p.user),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt.toISOString(),
    };

    try {
      const io = getServerSocket();
      conversation.participants.forEach((p) => {
        io.to(p.user.publicId).emit("conversation:new", formattedConversation);
      });
    } catch (e) {
      console.error("Failed to emit Socket.IO events:", e);
    }

    return NextResponse.json({ conversation: formattedConversation, new: true });
  } catch (err) {
    console.error("Error creating conversation:", err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}