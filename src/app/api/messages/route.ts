
import { prisma } from "@/lib/prisma";
import type { NextApiResponseServerIO } from "@/types/next";


export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      include: { sender: true },
      orderBy: { createdAt: "asc" },
    });

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
      status: 500,
    });
  }
}

/**
 
 * Creates a new message inside a conversation.
 * Emits `message:new` to all conversation participants.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationPublicId, senderPublicId, content } = body as {
      conversationPublicId: string;
      senderPublicId: string;
      content: string;
    };

    if (!conversationPublicId || !senderPublicId || !content) {
      return new Response(
        JSON.stringify({ error: "conversationPublicId, senderPublicId and content are required" }),
        { status: 400 }
      );
    }

    // Ensure conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { publicId: conversationPublicId },
      include: { participants: { include: { user: true } } },
    });

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
      });
    }

    // Ensure sender exists
    const sender = await prisma.user.findUnique({
      where: { publicId: senderPublicId },
    });

    if (!sender) {
      return new Response(JSON.stringify({ error: "Sender not found" }), {
        status: 404,
      });
    }

    const message = await prisma.message.create({
      data: {
        text: content,
        conversation: { connect: { publicId: conversationPublicId } },
        sender: { connect: { publicId: senderPublicId } },
      },
      include: { sender: true },
    });

    const res = new Response(JSON.stringify(message), { status: 201 });

    
    const resIO = res as unknown as { socket?: NextApiResponseServerIO["socket"] };
    if (resIO.socket && resIO.socket.server && resIO.socket.server.io) {
      conversation.participants.forEach((p) => {
        resIO.socket!.server.io!.to(p.user.publicId).emit("message:new", {
          conversationPublicId,
          message,
        });
      });
    }

    return res;
  } catch (err) {
    console.error(" Failed to create message:", err);
    return new Response(JSON.stringify({ error: "Failed to create message" }), {
      status: 500,
    });
  }
}
