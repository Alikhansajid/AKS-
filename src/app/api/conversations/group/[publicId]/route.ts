import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";
import { Role } from "@/types/enums";

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

// Define type for updateData
interface UpdateConversationData {
  name?: string;
  description?: string;
  profilePic?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user!.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const participantPublicIds = JSON.parse(formData.get("participantPublicIds") as string);
    const profilePic = formData.get("profilePic") as string | null;
    const adminPublicId = (formData.get("adminPublicId") as string) || session.user!.publicId;

    if (!name || !participantPublicIds || !Array.isArray(participantPublicIds)) {
      return NextResponse.json({ error: "Name and participantPublicIds are required" }, { status: 400 });
    }

    // Validate participantPublicIds
    if (participantPublicIds.some((id) => !id || typeof id !== "string")) {
      return NextResponse.json({ error: "Invalid participantPublicIds: All IDs must be non-empty strings" }, { status: 400 });
    }

    const participants = await prisma.user.findMany({
      where: { publicId: { in: [session.user!.publicId, ...participantPublicIds] } },
      select: { publicId: true, name: true, role: true, profilePic: true },
    });

    if (participants.length !== participantPublicIds.length + 1) {
      const foundPublicIds = new Set(participants.map((p) => p.publicId));
      const missingPublicIds = [session.user!.publicId, ...participantPublicIds].filter(
        (id) => !foundPublicIds.has(id)
      );
      return NextResponse.json(
        {
          error: "One or more participants not found",
          details: `Missing participant IDs: ${missingPublicIds.join(", ")}`,
        },
        { status: 404 }
      );
    }

    const admin = await prisma.user.findUnique({
      where: { publicId: adminPublicId, deletedAt: null },
      select: { publicId: true, name: true, role: true, profilePic: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        id: uuidv4(),
        publicId: uuidv4(),
        isGroup: true,
        name,
        description: description || undefined,
        profilePic: profilePic || undefined,
        allowAllMessages: true,
        participants: {
          create: participants.map((user) => ({
            user: { connect: { publicId: user.publicId } },
            isAdmin: user.publicId === adminPublicId,
          })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
        },
        messages: {
          include: {
            sender: { select: { publicId: true, name: true, role: true } },
          },
        },
      },
    }) as ApiConversation;

    const formattedConversation: ConversationResponse = {
      publicId: conversation.publicId!,
      isGroup: conversation.isGroup,
      name: conversation.name,
      description: conversation.description,
      profilePic: conversation.profilePic,
      allowAllMessages: conversation.allowAllMessages,
      participants: conversation.participants.map((p) => p.user),
      admins: conversation.participants
        .filter((p) => p.isAdmin)
        .map((p) => p.user),
      lastMessage: conversation.messages[0]
        ? {
            publicId: conversation.messages[0].publicId,
            conversationPublicId: conversation.publicId!,
            sender: conversation.messages[0].sender,
            content: conversation.messages[0].text,
            createdAt: conversation.messages[0].createdAt.toISOString(),
          }
        : null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt.toISOString(),
    };

    const io = getServerSocket();
    if (io) {
      conversation.participants.forEach((p: Participant) => {
        io.to(p.user.publicId).emit("conversation:new", formattedConversation);
      });
    } else {
      console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
    }

    return NextResponse.json({ conversation: formattedConversation });
  } catch (err) {
    console.error("Error creating group conversation:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      participantPublicIds: (await req.formData().catch(() => new FormData())).get("participantPublicIds"),
      adminPublicId: (await req.formData().catch(() => new FormData())).get("adminPublicId"),
    });
    return NextResponse.json(
      { error: "Failed to create group conversation", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user!.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { publicId } = await params;
    const publicIdForError = publicId; // Store for catch block
    const formData = await req.formData();
    const name = formData.get("name") as string | undefined;
    const description = formData.get("description") as string | undefined;
    const profilePic = formData.get("profilePic") as string | undefined;

    const updateData: UpdateConversationData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (profilePic) updateData.profilePic = profilePic;

    const conversation = await prisma.conversation.update({
      where: { publicId },
      data: updateData,
      include: {
        participants: {
          include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
        },
        messages: {
          include: {
            sender: { select: { publicId: true, name: true, role: true } },
          },
        },
      },
    }) as ApiConversation;

    const formattedConversation: ConversationResponse = {
      publicId: conversation.publicId!,
      isGroup: conversation.isGroup,
      name: conversation.name,
      description: conversation.description,
      profilePic: conversation.profilePic,
      allowAllMessages: conversation.allowAllMessages,
      participants: conversation.participants.map((p) => p.user),
      admins: conversation.participants
        .filter((p) => p.isAdmin)
        .map((p) => p.user),
      lastMessage: conversation.messages[0]
        ? {
            publicId: conversation.messages[0].publicId,
            conversationPublicId: conversation.publicId!,
            sender: conversation.messages[0].sender,
            content: conversation.messages[0].text,
            createdAt: conversation.messages[0].createdAt.toISOString(),
          }
        : null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt.toISOString(),
    };

    const io = getServerSocket();
    if (io) {
      conversation.participants.forEach((p: Participant) => {
        io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
      });
    } else {
      console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
    }

    return NextResponse.json({ conversation: formattedConversation });
  } catch (err) {
    console.error("Error updating group conversation:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      publicId: publicIdForError,
    });
    return NextResponse.json(
      { error: "Failed to update group conversation", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}