import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { pusher, convoChannel, NEW_MESSAGE_EVENT } from '@/lib/pusher';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getSession(req);
    const me = session?.user;
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = params;
    if (!conversationId)
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

    // Ensure requester is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { publicId: conversationId },
      include: {
        participants: { include: { user: { select: { publicId: true, role: true, name: true } } } },
      },
    });
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isParticipant = conversation.participants.some(
      (p) => p.user.publicId === me.publicId
    );
    if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { publicId: true, name: true, role: true } } },
    });

    return NextResponse.json({ conversation, messages });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getSession(req);
    const me = session?.user;
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = params;
    const { content } = await req.json();
    if (!conversationId || !content)
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const convo = await prisma.conversation.findUnique({ where: { publicId: conversationId } });
    if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // verify participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: convo.id,
        user: { publicId: me.publicId },
      },
    });
    if (!participant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const msg = await prisma.message.create({
      data: {
        publicId: randomUUID(),
        content,
        conversation: { connect: { id: convo.id } },
        sender: { connect: { publicId: me.publicId } },
      },
      include: { sender: { select: { publicId: true, name: true, role: true } } },
    });

    await prisma.conversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    });

    await pusher.trigger(convoChannel(convo.publicId), NEW_MESSAGE_EVENT, {
      message: msg,
    });

    return NextResponse.json(msg);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}









