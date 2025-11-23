// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getSession } from "@/lib/session";
// import { getServerSocket } from "@/lib/socket";
// import { v4 as uuidv4 } from "uuid";


// // Define types for type safety
// interface Session {
//   user?: {
//     publicId: string;
//     role: string;
//   } | null;
// }

// interface User {
//   publicId: string;
//   name: string;
//   role: string;
//   profilePic?: string;
// }

// interface Participant {
//   user: User;
//   isAdmin: boolean;
//   lastRead?: Date;
// }

// interface Message {
//   publicId: string;
//   text: string;
//   createdAt: Date;
//   sender: User;
// }

// interface ApiConversation {
//   id: string;
//   publicId: string | null;
//   isGroup: boolean;
//   name?: string;
//   description?: string;
//   profilePic?: string;
//   allowAllMessages: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   deletedAt: Date | null;
//   participants: Participant[];
//   messages: Message[];
// }

// interface ConversationResponse {
//   publicId: string;
//   isGroup: boolean;
//   name?: string;
//   description?: string;
//   profilePic?: string;
//   allowAllMessages: boolean;
//   participants: User[];
//   admins: User[];
//   lastMessage?: {
//     publicId: string;
//     conversationPublicId: string;
//     sender: User;
//     content: string;
//     createdAt: string;
//   } | null;
//   unreadCount: number;
//   updatedAt: string;
// }

// // GET: Fetch all conversations for the authenticated user
// export async function GET(req: NextRequest) {
//   try {
//     // Retrieve session to verify user authentication
//     const session = await getSession(req) as Session;
//     if (!session?.user?.publicId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Fetch conversations where the user is a participant
//     const conversations = await prisma.conversation.findMany({
//       where: {
//         participants: {
//           some: { user: { publicId: session.user!.publicId } },
//         },
//         deletedAt: null, // Exclude soft-deleted conversations
//       },
//       include: {
//         participants: {
//           select: {
//             user: { select: { publicId: true, name: true, role: true, profilePic: true } },
//             isAdmin: true,
//             lastRead: true,
//           },
//         },
//         messages: {
//           orderBy: { createdAt: "desc" },
//           take: 1,
//           include: {
//             sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
//           },
//         },
//       },
//       orderBy: { updatedAt: "desc" },
//     }) as ApiConversation[];

//     // Calculate unread message count for each conversation
//     const conversationsWithUnread = await Promise.all(
//       conversations.map(async (c) => {
//         const participant = c.participants.find(
//           (p) => p.user.publicId === session.user!.publicId
//         );
//         const lastRead = participant?.lastRead;

//         const unreadCount = await prisma.message.count({
//           where: {
//             conversationId: c.id,
//             createdAt: lastRead ? { gt: lastRead } : undefined,
//             status: { not: "READ" },
//             sender: { publicId: { not: session.user!.publicId } },
//           },
//         });

//         return {
//           publicId: c.publicId!,
//           isGroup: c.isGroup,
//           name: c.name,
//           description: c.description,
//           profilePic: c.profilePic,
//           allowAllMessages: c.allowAllMessages,
//           participants: c.participants.map((p) => p.user),
//           admins: c.participants
//             .filter((p) => p.isAdmin)
//             .map((p) => p.user),
//           lastMessage: c.messages[0]
//             ? {
//                 publicId: c.messages[0].publicId,
//                 conversationPublicId: c.publicId!,
//                 sender: c.messages[0].sender,
//                 content: c.messages[0].text,
//                 createdAt: c.messages[0].createdAt.toISOString(),
//               }
//             : null,
//           unreadCount,
//           updatedAt: c.updatedAt.toISOString(),
//         } as ConversationResponse;
//       })
//     );

//     return NextResponse.json(conversationsWithUnread, { status: 200 });
//   } catch (err) {
//     console.error("Error fetching conversations:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch conversations", details: (err as Error).message },
//       { status: 500 }
//     );
//   }
// }

// // POST: Create a new direct conversation
// export async function POST(req: NextRequest) {
//   try {
//     // Retrieve session to verify user authentication
//     const session = await getSession(req) as Session;
//     if (!session?.user?.publicId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Parse request body for participantPublicId
//     const body = await req.json();
//     const { participantPublicId } = body;

//     if (!participantPublicId || typeof participantPublicId !== "string") {
//       return NextResponse.json(
//         { error: "Invalid input: participantPublicId is required and must be a string" },
//         { status: 400 }
//       );
//     }

//     // Verify that the participant exists and is not soft-deleted
//     const participant = await prisma.user.findUnique({
//       where: { publicId: participantPublicId, deletedAt: null },
//       select: { publicId: true, name: true, role: true, profilePic: true },
//     }) as User | null;

//     if (!participant) {
//       return NextResponse.json({ error: "Participant not found" }, { status: 404 });
//     }

//     // Prevent creating a conversation with oneself
//     if (participant.publicId === session.user.publicId) {
//       return NextResponse.json(
//         { error: "Cannot create a conversation with yourself" },
//         { status: 400 }
//       );
//     }

//     // Check if a direct conversation already exists between the users
//     const existing = await prisma.conversation.findFirst({
//       where: {
//         isGroup: false,
//         deletedAt: null,
//         participants: {
//           every: {
//             user: {
//               publicId: { in: [session.user!.publicId, participantPublicId] },
//             },
//           },
//         },
//       },
//       include: {
//         participants: {
//           include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
//         },
//         messages: {
//           include: {
//             sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
//           },
//         },
//       },
//     }) as ApiConversation | null;

//     if (existing) {
//       const formattedExistingConversation: ConversationResponse = {
//         publicId: existing.publicId!,
//         isGroup: existing.isGroup,
//         name: existing.name,
//         description: existing.description,
//         profilePic: existing.profilePic,
//         allowAllMessages: existing.allowAllMessages,
//         participants: existing.participants.map((p) => p.user),
//         admins: existing.participants
//           .filter((p) => p.isAdmin)
//           .map((p) => p.user),
//         lastMessage: existing.messages[0]
//           ? {
//               publicId: existing.messages[0].publicId,
//               conversationPublicId: existing.publicId!,
//               sender: existing.messages[0].sender,
//               content: existing.messages[0].text,
//               createdAt: existing.messages[0].createdAt.toISOString(),
//             }
//           : null,
//         unreadCount: 0, // Assume unread count is 0 since the user is accessing it
//         updatedAt: existing.updatedAt.toISOString(),
//       };
//       return NextResponse.json({ conversation: formattedExistingConversation, new: false }, { status: 200 });
//     }

//     // Create a new direct conversation
//     const conversation = await prisma.conversation.create({
//       data: {
//         id: uuidv4(),
//         publicId: uuidv4(),
//         isGroup: false,
//         allowAllMessages: true,
//         participants: {
//           create: [
//             { user: { connect: { publicId: session.user!.publicId } } },
//             { user: { connect: { publicId: participantPublicId } } },
//           ],
//         },
//       },
//       include: {
//         participants: {
//           include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
//         },
//         messages: {
//           include: {
//             sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
//           },
//         },
//       },
//     }) as ApiConversation;

//     // Format the conversation for the frontend
//     const formattedConversation: ConversationResponse = {
//       publicId: conversation.publicId!,
//       isGroup: conversation.isGroup,
//       name: conversation.name,
//       description: conversation.description,
//       profilePic: conversation.profilePic,
//       allowAllMessages: conversation.allowAllMessages,
//       participants: conversation.participants.map((p) => p.user),
//       admins: conversation.participants
//         .filter((p) => p.isAdmin)
//         .map((p) => p.user),
//       lastMessage: null,
//       unreadCount: 0,
//       updatedAt: conversation.updatedAt.toISOString(),
//     };

//     // Emit Socket.IO event to notify participants
//     try {
//       const io = getServerSocket();
//       if (io) {
//         conversation.participants.forEach((p: Participant) => {
//           io.to(p.user.publicId).emit("conversation:new", formattedConversation);
//         });
//       } else {
//         console.warn("Socket.IO server not initialized, skipping event emission");
//       }
//     } catch (e) {
//       console.error("Failed to emit Socket.IO events:", e);
//     }

//     return NextResponse.json({ conversation: formattedConversation, new: true }, { status: 201 });
//   } catch (err) {
//     console.error("Error creating conversation:", err);
//     return NextResponse.json(
//       { error: "Failed to create conversation", details: (err as Error).message },
//       { status: 500 }
//     );
//   }
// }










import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { v4 as uuidv4 } from "uuid";
import { ConversationType } from "@/types/enums";

// Define types for type safety
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
  type: ConversationType;
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

// GET: Fetch all conversations for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Retrieve session to verify user authentication
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { user: { publicId: session.user!.publicId } },
        },
        deletedAt: null, // Exclude soft-deleted conversations
      },
      include: {
        participants: {
          select: {
            user: { select: { publicId: true, name: true, role: true, profilePic: true } },
            isAdmin: true,
            lastRead: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }) as ApiConversation[];

    // Calculate unread message count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (c) => {
        const participant = c.participants.find(
          (p) => p.user.publicId === session.user!.publicId
        );
        const lastRead = participant?.lastRead;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            createdAt: lastRead ? { gt: lastRead } : undefined,
            sender: { publicId: { not: session.user!.publicId } },
          },
        });

        return {
          publicId: c.publicId!,
          type: c.isGroup ? ConversationType.GROUP : ConversationType.DIRECT,
          name: c.isGroup ? c.name || "Unnamed Group" : undefined,
          description: c.description,
          profilePic: c.profilePic,
          allowAllMessages: c.allowAllMessages,
          participants: c.participants.map((p) => p.user),
          admins: c.participants
            .filter((p) => p.isAdmin)
            .map((p) => p.user),
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

    return NextResponse.json(conversationsWithUnread, { status: 200 });
  } catch (err) {
    console.error("Error fetching conversations:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to fetch conversations", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// POST: Create a new direct conversation
export async function POST(req: NextRequest) {
  try {
    // Retrieve session to verify user authentication
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body for participantPublicId
    const body = await req.json();
    const { participantPublicId } = body;

    if (!participantPublicId || typeof participantPublicId !== "string") {
      return NextResponse.json(
        { error: "Invalid input: participantPublicId is required and must be a string" },
        { status: 400 }
      );
    }

    // Verify that the participant exists and is not soft-deleted
    const participant = await prisma.user.findUnique({
      where: { publicId: participantPublicId, deletedAt: null },
      select: { publicId: true, name: true, role: true, profilePic: true },
    }) as User | null;

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (!participant.name) {
      console.warn(`User ${participant.publicId} has no name, defaulting to "Unknown"`);
      participant.name = "Unknown";
    }

    // Prevent creating a conversation with oneself
    if (participant.publicId === session.user.publicId) {
      return NextResponse.json(
        { error: "Cannot create a conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if a direct conversation already exists between the users
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        deletedAt: null,
        participants: {
          every: {
            user: {
              publicId: { in: [session.user!.publicId, participantPublicId] },
            },
          },
        },
      },
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

    if (existing) {
      const formattedExistingConversation: ConversationResponse = {
        publicId: existing.publicId!,
        type: ConversationType.DIRECT,
        name: undefined,
        description: existing.description,
        profilePic: existing.profilePic,
        allowAllMessages: existing.allowAllMessages,
        participants: existing.participants.map((p) => ({
          ...p.user,
          name: p.user.name || "Unknown",
        })),
        admins: existing.participants
          .filter((p) => p.isAdmin)
          .map((p) => p.user),
        lastMessage: existing.messages[0]
          ? {
              publicId: existing.messages[0].publicId,
              conversationPublicId: existing.publicId!,
              sender: {
                ...existing.messages[0].sender,
                name: existing.messages[0].sender.name || "Unknown",
              },
              content: existing.messages[0].text,
              createdAt: existing.messages[0].createdAt.toISOString(),
            }
          : null,
        unreadCount: 0,
        updatedAt: existing.updatedAt.toISOString(),
      };
      return NextResponse.json({ conversation: formattedExistingConversation, new: false }, { status: 200 });
    }

    // Create a new direct conversation
    const conversation = await prisma.conversation.create({
      data: {
        id: uuidv4(),
        publicId: uuidv4(),
        isGroup: false,
        allowAllMessages: true,
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
            sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
          },
        },
      },
    }) as ApiConversation;

    // Format the conversation for the frontend
    const formattedConversation: ConversationResponse = {
      publicId: conversation.publicId!,
      type: ConversationType.DIRECT,
      name: undefined,
      description: conversation.description,
      profilePic: conversation.profilePic,
      allowAllMessages: conversation.allowAllMessages,
      participants: conversation.participants.map((p) => ({
        ...p.user,
        name: p.user.name || "Unknown",
      })),
      admins: conversation.participants
        .filter((p) => p.isAdmin)
        .map((p) => p.user),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt.toISOString(),
    };

    // Emit Socket.IO event to notify participants
    try {
      const io = getServerSocket();
      if (io) {
        conversation.participants.forEach((p: Participant) => {
          io.to(p.user.publicId).emit("conversation:new", formattedConversation);
        });
      } else {
        console.warn("Socket.IO server not initialized, skipping event emission");
      }
    } catch (e) {
      console.error("Failed to emit Socket.IO events:", e);
    }

    return NextResponse.json({ conversation: formattedConversation, new: true }, { status: 201 });
  } catch (err) {
    console.error("Error creating conversation:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to create conversation", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}