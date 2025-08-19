import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { Role } from '@/types/enums';
import { pusher, convoChannel, NEW_MESSAGE_EVENT } from '@/lib/pusher';

// GET messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getSession(req);
    const me = session?.user;

    if (!me || me.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const convo = await prisma.conversation.findUnique({
      where: { publicId: params.conversationId },
      include: {
        participants: {
          include: {
            user: { select: { publicId: true, name: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { publicId: true, name: true, role: true } },
          },
        },
      },
    });

    if (!convo) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(convo);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST a new message from admin
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getSession(req);
    const me = session?.user;

    if (!me || me.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const convo = await prisma.conversation.findUnique({
      where: { publicId: params.conversationId },
    });

    if (!convo) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const msg = await prisma.message.create({
      data: {
        publicId: randomUUID(),
        content,
        conversation: { connect: { id: convo.id } },
        sender: { connect: { publicId: me.publicId } },
      },
      include: {
        sender: { select: { publicId: true, name: true, role: true } },
      },
    });

    // update convo timestamp
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    });

    // send real-time update to this conversation channel
    await pusher.trigger(convoChannel(convo.publicId), NEW_MESSAGE_EVENT, {
      message: msg,
    });

    return NextResponse.json(msg);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
