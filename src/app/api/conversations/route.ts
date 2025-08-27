import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";

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

interface UserOnConversation {
  user: User;
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
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  participants: UserOnConversation[];
  messages: Message[];
}

// Response shape for the API
interface ConversationResponse {
  publicId: string;
  participants: User[];
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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { user: { publicId: session.user!.publicId } },
        },
      },
      include: {
        participants: {
          select: {
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
    }) as ApiConversation[];

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (c) => {
        const userOnConversation = c.participants.find(
          (p) => p.user.publicId === session.user!.publicId
        );
        const lastRead = userOnConversation?.lastRead;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            createdAt: lastRead ? { gt: lastRead } : undefined,
            status: { not: "READ" },
            sender: { publicId: { not: session.user!.publicId } },
          },
        });

        return {
          publicId: c.publicId!,
          participants: c.participants.map((p) => p.user),
          lastMessage: c.messages[0]
            ? {
                publicId: c.messages[0].publicId,
                conversationPublicId: c.publicId!,
                sender: c.messages[0].sender,
                content: c.messages[0].text,
                createdAt: c.messages[0].createdAt.toISOString(),
              }
            : null,
          unreadCount,
          updatedAt: c.updatedAt.toISOString(),
        } as ConversationResponse;
      })
    );

    return NextResponse.json(conversationsWithUnread);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user!.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { participantPublicId } = body;

    if (!participantPublicId) {
      return NextResponse.json({ error: "participantPublicId required" }, { status: 400 });
    }

    const participant = await prisma.user.findUnique({
      where: { publicId: participantPublicId },
    }) as User | null;

    if (!participant) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            user: {
              publicId: { in: [session.user!.publicId, participantPublicId] },
            },
          },
        },
      },
    }) as ApiConversation | null;

    if (existing) {
      return NextResponse.json({ conversation: existing, new: false });
    }

    const conversation = await prisma.conversation.create({
      data: {
        publicId: uuidv4(),
        participants: {
          create: [
            { user: { connect: { publicId: session.user!.publicId } } },
            { user: { connect: { publicId: participantPublicId } } },
          ],
        },
      },
      include: {
        participants: {
          include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
        },
        messages: {
          include: {
            sender: { select: { publicId: true, name: true, role: true } }, // Include sender relation
          },
        },
      },
    }) as ApiConversation;

    const formattedConversation = {
      publicId: conversation.publicId!,
      participants: conversation.participants.map((p) => p.user),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt.toISOString(),
    };

    try {
      const io = getServerSocket();
      conversation.participants.forEach((p: UserOnConversation) => {
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