import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";
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

interface Participant {
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
  participants: Participant[];
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

export async function POST(req: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = params;
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Invalid input: text is required" }, { status: 400 });
    }

    // Fetch the user's id based on publicId
    const sender = await prisma.user.findUnique({
      where: { publicId: session.user!.publicId, deletedAt: null },
      select: { id: true },
    });

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is a participant and has permission to send messages
    const conversation = await prisma.conversation.findUnique({
      where: { publicId, deletedAt: null },
      select: {
        id: true,
        publicId: true,
        isGroup: true,
        allowAllMessages: true,
        participants: {
          select: {
            user: { select: { publicId: true, role: true } },
            isAdmin: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some((p) => p.user.publicId === session.user!.publicId);
    if (!isParticipant) {
      return NextResponse.json({ error: "User is not a participant" }, { status: 403 });
    }

    const isGroupAdmin = conversation.participants.some(
      (p) => p.user.publicId === session.user!.publicId && p.isAdmin
    );

    if (!conversation.allowAllMessages && !isGroupAdmin && session.user!.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Only admins can send messages" }, { status: 403 });
    }

    // Create the message
    const messagePublicId = uuidv4();
    const message = await prisma.message.create({
      data: {
        publicId: messagePublicId,
        text: text.trim(),
        conversationId: conversation.id,
        senderId: sender.id, // Use the user's id (Int) instead of publicId
      },
      select: {
        publicId: true,
        text: true,
        createdAt: true,
        sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
      },
    });

    // Fetch updated conversation
    const updatedConversation = await prisma.conversation.findUnique({
      where: { publicId },
      select: {
        id: true,
        publicId: true,
        isGroup: true,
        name: true,
        description: true,
        profilePic: true,
        allowAllMessages: true,
        updatedAt: true,
        participants: {
          select: {
            user: { select: { publicId: true, name: true, role: true, profilePic: true } },
            isAdmin: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            publicId: true,
            text: true,
            createdAt: true,
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

    // Notify participants via Socket.IO
    const io = getServerSocket();
    if (io) {
      io.to(publicId).emit("message:new", {
        publicId: message.publicId,
        conversationPublicId: publicId,
        sender: message.sender,
        content: message.text,
        createdAt: message.createdAt.toISOString(),
      });
      updatedConversation.participants.forEach((p: Participant) => {
        io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
      });
    } else {
      console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
    }

    return NextResponse.json({ conversation: formattedConversation, message });
  } catch (err) {
    console.error("Error sending group message:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      publicId: params.publicId,
    });
    return NextResponse.json(
      { error: "Failed to send group message", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}