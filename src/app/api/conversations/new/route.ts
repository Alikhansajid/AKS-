// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getSession } from "@/lib/session";
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

// export async function POST(req: NextRequest) {
//   try {
//     const session = await getSession(req) as Session;
//     if (!session?.user?.publicId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { userPublicId } = await req.json();

//     if (!userPublicId || typeof userPublicId !== "string") {
//       return NextResponse.json(
//         { error: "Invalid input: userPublicId is required and must be a string" },
//         { status: 400 }
//       );
//     }

//     // Verify that the participant exists and is not soft-deleted
//     const participant = await personally {
//       where: { publicId: userPublicId, deletedAt: null },
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
//     let conversation = await prisma.conversation.findFirst({
//       where: {
//         isGroup: false,
//         deletedAt: null,
//         participants: {
//           every: {
//             user: { publicId: { in: [session.user!.publicId, userPublicId] } },
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

//     if (!conversation) {
//       conversation = await prisma.conversation.create({
//         data: {
//           id: uuidv4(),
//           publicId: uuidv4(),
//           isGroup: false,
//           allowAllMessages: true,
//           participants: {
//             create: [
//               { user: { connect: { publicId: session.user!.publicId } } },
//               { user: { connect: { publicId: userPublicId } } },
//             ],
//           },
//         },
//         include: {
//           participants: {
//             include: { user: { select: { publicId: true, name: true, role: true, profilePic: true } } },
//           },
//           messages: {
//             include: {
//               sender: { select: { publicId: true, name: true, role: true, profilePic: true } },
//             },
//           },
//         },
//       }) as ApiConversation;
//     }

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
//       lastMessage: conversation.messages[0]
//         ? {
//             publicId: conversation.messages[0].publicId,
//             conversationPublicId: conversation.publicId!,
//             sender: conversation.messages[0].sender,
//             content: conversation.messages[0].text,
//             createdAt: conversation.messages[0].createdAt.toISOString(),
//           }
//         : null,
//       unreadCount: 0,
//       updatedAt: conversation.updatedAt.toISOString(),
//     };

//     return NextResponse.json(formattedConversation);
//   } catch (err) {
//     console.error("Error creating conversation:", err);
//     return NextResponse.json(
//       { error: "Failed to start conversation", details: (err as Error).message },
//       { status: 500 }
//     );
//   }
// }