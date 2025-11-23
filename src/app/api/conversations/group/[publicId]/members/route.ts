// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getSession } from "@/lib/session";
// import { getServerSocket } from "@/lib/socket";
// import { Role, ConversationType, GroupRole } from "@/types/enums";

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

// interface UserOnConversation {
//   user: User;
//   role: GroupRole;
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
//   type: ConversationType;
//   name?: string;
//   description?: string;
//   profilePic?: string;
//   allowAllMessages: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   deletedAt: Date | null;
//   participants: UserOnConversation[];
//   messages: Message[];
// }

// interface ConversationResponse {
//   publicId: string;
//   type: ConversationType;
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

// export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
//   try {
//     const session = await getSession(req) as Session;
//     if (!session?.user?.publicId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Await params to access publicId
//     const { publicId } = await params;
//     const { userPublicId, action } = await req.json();

//     if (!userPublicId || !["add", "remove"].includes(action)) {
//       return NextResponse.json({ error: "Invalid input: userPublicId and action (add/remove) required" }, { status: 400 });
//     }

//     // Check if user is a group admin or system admin
//     const conversation = await prisma.conversation.findUnique({
//       where: { publicId },
//       select: {
//         id: true,
//         publicId: true,
//         type: true,
//         participants: {
//           select: {
//             user: { select: { publicId: true, role: true } },
//             role: true,
//           },
//         },
//       },
//     });

//     if (!conversation) {
//       return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
//     }

//     const isGroupAdmin = conversation.participants.some(
//       (p) => p.user.publicId === session.user!.publicId && p.role === GroupRole.GROUP_ADMIN
//     );

//     if (!isGroupAdmin && session.user!.role !== Role.ADMIN) {
//       return NextResponse.json({ error: "Forbidden: Not a group admin" }, { status: 403 });
//     }

//     // Handle add/remove member
//     if (action === "add") {
//       // Verify user exists
//       const user = await prisma.user.findUnique({
//         where: { publicId: userPublicId },
//         select: { id: true },
//       });
//       if (!user) {
//         return NextResponse.json({ error: "User not found" }, { status: 404 });
//       }

//       // Check if user is already a participant
//       const isParticipant = conversation.participants.some((p) => p.user.publicId === userPublicId);
//       if (isParticipant) {
//         return NextResponse.json({ error: "User is already a participant" }, { status: 400 });
//       }

//       // Add user to conversation
//       await prisma.userOnConversation.create({
//         data: {
//           userId: userPublicId,
//           conversationId: conversation.id,
//           role: GroupRole.MEMBER,
//         },
//       });
//     } else {
//       // Verify user is a participant
//       const isParticipant = conversation.participants.some((p) => p.user.publicId === userPublicId);
//       if (!isParticipant) {
//         return NextResponse.json({ error: "User is not a participant" }, { status: 400 });
//       }

//       // Prevent removing the last admin
//       const adminCount = conversation.participants.filter((p) => p.role === GroupRole.GROUP_ADMIN).length;
//       const isTargetAdmin = conversation.participants.some(
//         (p) => p.user.publicId === userPublicId && p.role === GroupRole.GROUP_ADMIN
//       );
//       if (isTargetAdmin && adminCount <= 1) {
//         return NextResponse.json({ error: "Cannot remove the last group admin" }, { status: 400 });
//       }

//       // Remove user from conversation
//       await prisma.userOnConversation.delete({
//         where: {
//           userId_conversationId: {
//             userId: userPublicId,
//             conversationId: conversation.id,
//           },
//         },
//       });
//     }

//     // Fetch updated conversation
//     const updatedConversation = await prisma.conversation.findUnique({
//       where: { publicId },
//       select: {
//         id: true,
//         publicId: true,
//         type: true,
//         name: true,
//         description: true,
//         profilePic: true,
//         allowAllMessages: true,
//         updatedAt: true,
//         participants: {
//           select: {
//             user: { select: { publicId: true, name: true, role: true, profilePic: true } },
//             role: true,
//           },
//         },
//         messages: {
//           take: 1,
//           orderBy: { createdAt: "desc" },
//           select: {
//             publicId: true,
//             text: true,
//             createdAt: true,
//             sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
//           },
//         },
//       },
//     }) as ApiConversation;

//     const formattedConversation: ConversationResponse = {
//       publicId: updatedConversation.publicId!,
//       type: updatedConversation.type,
//       name: updatedConversation.name,
//       description: updatedConversation.description,
//       profilePic: updatedConversation.profilePic,
//       allowAllMessages: updatedConversation.allowAllMessages,
//       participants: updatedConversation.participants.map((p) => p.user),
//       admins: updatedConversation.participants
//         .filter((p) => p.role === GroupRole.GROUP_ADMIN)
//         .map((p) => p.user),
//       lastMessage: updatedConversation.messages[0]
//         ? {
//             publicId: updatedConversation.messages[0].publicId,
//             conversationPublicId: updatedConversation.publicId!,
//             sender: updatedConversation.messages[0].sender,
//             content: updatedConversation.messages[0].text,
//             createdAt: updatedConversation.messages[0].createdAt.toISOString(),
//           }
//         : null,
//       unreadCount: 0,
//       updatedAt: updatedConversation.updatedAt.toISOString(),
//     };

//     // Notify participants via Socket.IO
//     const io = getServerSocket();
//     if (io) {
//       updatedConversation.participants.forEach((p: UserOnConversation) => {
//         io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
//       });
//       if (action === "add") {
//         io.to(userPublicId).emit("message:sidebar", formattedConversation);
//       }
//     } else {
//       console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
//     }

//     return NextResponse.json({ conversation: formattedConversation });
//   } catch (err) {
//     console.error("Error managing group member:", {
//       error: err instanceof Error ? err.message : String(err),
//       stack: err instanceof Error ? err.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Failed to manage group member", details: err instanceof Error ? err.message : String(err) },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
//   try {
//     const session = await getSession(req) as Session;
//     if (!session?.user?.publicId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Await params to access publicId
//     const { publicId } = await params;
//     const { userPublicId } = await req.json();

//     if (!userPublicId) {
//       return NextResponse.json({ error: "Invalid input: userPublicId required" }, { status: 400 });
//     }

//     // Check if user is a group admin or system admin
//     const conversation = await prisma.conversation.findUnique({
//       where: { publicId },
//       select: {
//         id: true,
//         publicId: true,
//         type: true,
//         participants: {
//           select: {
//             user: { select: { publicId: true, role: true } },
//             role: true,
//           },
//         },
//       },
//     });

//     if (!conversation) {
//       return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
//     }

//     const isGroupAdmin = conversation.participants.some(
//       (p) => p.user.publicId === session.user!.publicId && p.role === GroupRole.GROUP_ADMIN
//     );

//     if (!isGroupAdmin && session.user!.role !== Role.ADMIN) {
//       return NextResponse.json({ error: "Forbidden: Not a group admin" }, { status: 403 });
//     }

//     // Verify user is a participant
//     const isParticipant = conversation.participants.some((p) => p.user.publicId === userPublicId);
//     if (!isParticipant) {
//       return NextResponse.json({ error: "User is not a participant" }, { status: 400 });
//     }

//     // Prevent removing the last admin
//     const adminCount = conversation.participants.filter((p) => p.role === GroupRole.GROUP_ADMIN).length;
//     const isTargetAdmin = conversation.participants.some(
//       (p) => p.user.publicId === userPublicId && p.role === GroupRole.GROUP_ADMIN
//     );
//     if (isTargetAdmin && adminCount <= 1) {
//       return NextResponse.json({ error: "Cannot remove the last group admin" }, { status: 400 });
//     }

//     // Remove user from conversation
//     await prisma.userOnConversation.delete({
//       where: {
//         userId_conversationId: {
//           userId: userPublicId,
//           conversationId: conversation.id,
//         },
//       },
//     });

//     // Fetch updated conversation
//     const updatedConversation = await prisma.conversation.findUnique({
//       where: { publicId },
//       select: {
//         id: true,
//         publicId: true,
//         type: true,
//         name: true,
//         description: true,
//         profilePic: true,
//         allowAllMessages: true,
//         updatedAt: true,
//         participants: {
//           select: {
//             user: { select: { publicId: true, name: true, role: true, profilePic: true } },
//             role: true,
//           },
//         },
//         messages: {
//           take: 1,
//           orderBy: { createdAt: "desc" },
//           select: {
//             publicId: true,
//             text: true,
//             createdAt: true,
//             sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
//           },
//         },
//       },
//     }) as ApiConversation;

//     const formattedConversation: ConversationResponse = {
//       publicId: updatedConversation.publicId!,
//       type: updatedConversation.type,
//       name: updatedConversation.name,
//       description: updatedConversation.description,
//       profilePic: updatedConversation.profilePic,
//       allowAllMessages: updatedConversation.allowAllMessages,
//       participants: updatedConversation.participants.map((p) => p.user),
//       admins: updatedConversation.participants
//         .filter((p) => p.role === GroupRole.GROUP_ADMIN)
//         .map((p) => p.user),
//       lastMessage: updatedConversation.messages[0]
//         ? {
//             publicId: updatedConversation.messages[0].publicId,
//             conversationPublicId: updatedConversation.publicId!,
//             sender: updatedConversation.messages[0].sender,
//             content: updatedConversation.messages[0].text,
//             createdAt: updatedConversation.messages[0].createdAt.toISOString(),
//           }
//         : null,
//       unreadCount: 0,
//       updatedAt: updatedConversation.updatedAt.toISOString(),
//     };

//     // Notify participants via Socket.IO
//     const io = getServerSocket();
//     if (io) {
//       updatedConversation.participants.forEach((p: UserOnConversation) => {
//         io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
//       });
//       // Notify the removed user
//       io.to(userPublicId).emit("conversation:removed", { conversationId: publicId });
//     } else {
//       console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
//     }

//     return NextResponse.json({ conversation: formattedConversation });
//   } catch (err) {
//     console.error("Error removing group member:", {
//       error: err instanceof Error ? err.message : String(err),
//       stack: err instanceof Error ? err.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Failed to remove group member", details: err instanceof Error ? err.message : String(err) },
//       { status: 500 }
//     );
//   }
// }














import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSocket } from "@/lib/socket";
import { Role} from "@/types/enums";

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

async function manageConversationMember(
  req: NextRequest,
  publicId: string,
  userPublicId: string,
  action: "add" | "remove"
) {
  try {
    const session = await getSession(req) as Session;
    if (!session?.user?.publicId) {
      return NextResponse.json({ error: "Unauthorized: No active session found" }, { status: 401 });
    }

    // Validate input
    if (!userPublicId || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid input: userPublicId and action (add/remove) required" },
        { status: 400 }
      );
    }

    // Check if user is a group admin or system admin
    const conversation = await prisma.conversation.findUnique({
      where: { publicId },
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
      return NextResponse.json(
        { error: "Forbidden: Must be group admin or system admin" },
        { status: 403 }
      );
    }

    // Handle add/remove member
    if (action === "add") {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { publicId: userPublicId },
        select: { publicId: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }

      // Check if user is already a participant
      const isParticipant = conversation.participants.some((p) => p.user.publicId === userPublicId);
      if (isParticipant) {
        return NextResponse.json({ error: "User is already a participant" }, { status: 400 });
      }

      // Add user to conversation
      await prisma.participant.create({
        data: {
          userId: userPublicId,
          conversationId: conversation.id,
          isAdmin: false,
        },
      });
    } else {
      // Verify user is a participant
      const isParticipant = conversation.participants.some((p) => p.user.publicId === userPublicId);
      if (!isParticipant) {
        return NextResponse.json({ error: "User is not a participant" }, { status: 400 });
      }

      // Prevent removing the last admin
      const adminCount = conversation.participants.filter((p) => p.isAdmin).length;
      const isTargetAdmin = conversation.participants.some(
        (p) => p.user.publicId === userPublicId && p.isAdmin
      );
      if (isTargetAdmin && adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last group admin" }, { status: 400 });
      }

      // Remove user from conversation
      await prisma.participant.delete({
        where: {
          userId_conversationId: {
            userId: userPublicId,
            conversationId: conversation.id,
          },
        },
      });
    }

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
            lastRead: true,
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
      updatedConversation.participants.forEach((p: UserOnConversation) => {
        io.to(p.user.publicId).emit("message:sidebar", formattedConversation);
      });
      if (action === "add") {
        io.to(userPublicId).emit("message:sidebar", formattedConversation);
      } else {
        io.to(userPublicId).emit("conversation:removed", { conversationId: publicId });
      }
    } else {
      console.warn("🔌 Skipping Socket.IO notifications due to uninitialized server");
    }

    return NextResponse.json({ conversation: formattedConversation });
  } catch (err) {
    console.error(`Error ${action === "add" ? "adding" : "removing"} group member:`, {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      {
        error: `Failed to ${action === "add" ? "add" : "remove"} group member`,
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const { userPublicId } = await req.json();
  return manageConversationMember(req, publicId, userPublicId, "add");
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const { userPublicId } = await req.json();
  return manageConversationMember(req, publicId, userPublicId, "remove");
}