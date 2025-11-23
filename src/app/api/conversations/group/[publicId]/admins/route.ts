import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { Role } from "@/types/enums";

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

interface UserOnConversation {
  user: User;
  isAdmin: boolean;
  lastRead?: Date;
}

interface Message {
  publicId: string;
  text: string;
  createdAt: Date;
  sender: User;
}

interface ApiConversation {
  id: string;
  publicId: string | null;
  isGroup: boolean;
  name?: string;
  description?: string;
  profilePic?: string;
  allowAllMessages: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  participants: UserOnConversation[];
  messages: Message[];
}

interface ConversationResponse {
  publicId: string;
  isGroup: boolean;
  name?: string;
  description?: string;
  profilePic?: string;
  allowAllMessages: boolean;
  participants: User[];
  admins: User[];
  lastMessage?: {
    publicId: string;
    conversationPublicId: string;
    sender: User;
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  let publicId: string | undefined;
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized: No active session found" }, { status: 401 });
    }

    if (session.user!.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Only system admins can manage group admins" }, { status: 403 });
    }

    const resolvedParams = await params;
    publicId = resolvedParams.publicId;
    const { userPublicId, action } = await req.json();

    if (!userPublicId || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid input: userPublicId and action (add/remove) are required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { publicId },
      include: {
        participants: {
          include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
        },
        messages: {
          include: {
            sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
          },
        },
      },
    }) as ApiConversation | null;

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const participant = conversation.participants.find((p) => p.user.publicId === userPublicId);
    if (!participant) {
      return NextResponse.json({ error: "User is not a participant in this conversation" }, { status: 400 });
    }

    if (action === "remove") {
      const adminCount = conversation.participants.filter((p) => p.isAdmin).length;
      if (adminCount <= 1 && participant.isAdmin) {
        return NextResponse.json({ error: "Cannot remove the last group admin" }, { status: 400 });
      }
    }

    await prisma.participant.update({
      where: {
        userId_conversationId: {
          userId: userPublicId,
          conversationId: conversation.id,
        },
      },
      data: {
        isAdmin: action === "add" ? true : false,
      },
    });

    const updatedConversation = await prisma.conversation.findUnique({
      where: { publicId },
      include: {
        participants: {
          include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
        },
        messages: {
          include: {
            sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
          },
        },
      },
    }) as ApiConversation;

    const formattedConversation: ConversationResponse = {
      publicId: updatedConversation.publicId!,
      isGroup: updatedConversation.isGroup,
      name: updatedConversation.name,
      description: updatedConversation.description,
      profilePic: updatedConversation.profilePic,
      allowAllMessages: updatedConversation.allowAllMessages,
      participants: updatedConversation.participants.map((p) => p.user),
      admins: updatedConversation.participants
        .filter((p) => p.isAdmin)
        .map((p) => p.user),
      lastMessage: updatedConversation.messages[0]
        ? {
            publicId: updatedConversation.messages[0].publicId,
            conversationPublicId: updatedConversation.publicId!,
            sender: updatedConversation.messages[0].sender,
            content: updatedConversation.messages[0].text,
            createdAt: updatedConversation.messages[0].createdAt.toISOString(),
          }
        : null,
      unreadCount: 0,
      updatedAt: updatedConversation.updatedAt.toISOString(),
    };

    const io = getServerSocket();
    if (io) {
      updatedConversation.participants.forEach((p: UserOnConversation) => {
        io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
      });
    } else {
      console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
    }

    return NextResponse.json({ conversation: formattedConversation });
  } catch (err) {
    console.error("Error managing group admin:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      publicId: publicId || 'unknown',
      userPublicId: (await req.json().catch(() => ({}))).userPublicId,
      action: (await req.json().catch(() => ({}))).action,
    });
    return NextResponse.json(
      {
        error: "Failed to manage group admin",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}