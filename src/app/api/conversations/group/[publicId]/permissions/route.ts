import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { Role } from "@/types/enums";

// Mark the route as dynamic to prevent static generation issues
export const dynamic = "force-dynamic";

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

export async function PATCH(req: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = params;
    const { allowAllMessages } = await req.json();

    // Validate input
    if (typeof allowAllMessages !== "boolean") {
      return NextResponse.json({ error: "Invalid input: allowAllMessages must be a boolean" }, { status: 400 });
    }

    // Fetch conversation with minimal data for authorization
    const conversation = await prisma.conversation.findUnique({
      where: { publicId, deletedAt: null },
      select: {
        id: true,
        publicId: true,
        isGroup: true,
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

    const isGroupAdmin = conversation.participants.some(
      (p) => p.user.publicId === session.user!.publicId && p.isAdmin
    );

    if (!isGroupAdmin && session.user!.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Not authorized to update permissions" }, { status: 403 });
    }

    // Update conversation and fetch necessary data for response
    const updatedConversation = await prisma.conversation.update({
      where: { publicId },
      data: { allowAllMessages },
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

    const io = getServerSocket();
    if (io) {
      updatedConversation.participants.forEach((p: Participant) => {
        io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
      });
    } else {
      console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
    }

    return NextResponse.json({ conversation: formattedConversation });
  } catch (err) {
    console.error("Error updating group permissions:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      publicId: params.publicId,
    });
    return NextResponse.json(
      { error: "Failed to update group permissions", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}