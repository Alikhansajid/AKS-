import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";

// Define types
interface Session {
  user?: {
    publicId: string;
    role: string;
  } | null;
}

interface User {
  publicId: string;
  name: string;
  role: string;
  profilePic?: string;
}

interface Conversation {
  id: string;
  publicId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  participants: { user: User; lastRead?: Date }[];
  messages: {
    publicId: string;
    text: string;
    createdAt: Date;
    sender: User;
  }[];
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { publicId: conversationId },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: true },
        },
      },
    }) as Conversation | null;

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (!conversation.participants.some((p) => p.user.publicId === session.user!.publicId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update lastRead timestamp for the user in this conversation
    await prisma.participant.update({
      where: {
        userId_conversationId: {
          userId: session.user!.publicId, // Use publicId (String) instead of user.id
          conversationId: conversation.id,
        },
      },
      data: { lastRead: new Date() },
    });

    // Mark all messages in the conversation as READ for this user
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        status: { not: "READ" },
        sender: { publicId: { not: session.user!.publicId } },
      },
      data: { status: "READ" },
    });

    // Emit Socket.IO event to update unread count for participants
    try {
      const io = getServerSocket();
      if (!io) {
        console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
      } else {
        const updatedConversation = await prisma.conversation.findUnique({
          where: { publicId: conversationId },
          include: {
            participants: { include: { user: true } },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: true },
            },
          },
        }) as Conversation | null;

        if (updatedConversation) {
          const formattedConversation = {
            publicId: updatedConversation.publicId!,
            participants: updatedConversation.participants.map((p) => p.user),
            lastMessage: updatedConversation.messages[0]
              ? {
                  publicId: updatedConversation.messages[0].publicId,
                  conversationPublicId: updatedConversation.publicId!,
                  sender: updatedConversation.messages[0].sender,
                  content: updatedConversation.messages[0].text,
                  createdAt: updatedConversation.messages[0].createdAt,
                }
              : null,
            unreadCount: 0,
            updatedAt: updatedConversation.updatedAt,
          };

          updatedConversation.participants.forEach((p) => {
            io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
          });
        }
      }
    } catch (e) {
      console.error("Failed to emit Socket.IO events:", e);
    }

    return NextResponse.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}