// src/app/api/chat/customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { Role } from '@/types/enums';
import { pusher, convoChannel, NEW_MESSAGE_EVENT } from '@/lib/pusher';

async function getOrCreateCustomerAdminConversation(customerPublicId: string) {
  // find an admin
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!admin) throw new Error('No admin found');

  // check existing conversation between the two
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { user: { publicId: customerPublicId } } } },
        { participants: { some: { user: { publicId: admin.publicId } } } },
      ],
    },
    include: { participants: true },
  });

  if (existing) return existing;

  // otherwise create it
  return prisma.conversation.create({
    data: {
      publicId: randomUUID(),
      participants: {
        create: [
          { role: Role.CUSTOMER, user: { connect: { publicId: customerPublicId } } },
          { role: Role.ADMIN, user: { connect: { publicId: admin.publicId } } },
        ],
      },
    },
  });
}

// GET: messages + conversation id
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const me = session?.user;
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const convo = await getOrCreateCustomerAdminConversation(me.publicId);

    const messages = await prisma.message.findMany({
      where: { conversation: { publicId: convo.publicId } },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { publicId: true, name: true, role: true } },
      },
    });

    return NextResponse.json({
      conversationPublicId: convo.publicId,
      messages,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST: send message
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const me = session?.user;
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content } = await req.json();
    if (!content || typeof content !== 'string')
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });

    const convo = await getOrCreateCustomerAdminConversation(me.publicId);

    const msg = await prisma.message.create({
      data: {
        publicId: randomUUID(),
        content,
        conversation: { connect: { id: convo.id } },
        sender: { connect: { publicId: me.publicId } },
      },
      include: { sender: { select: { publicId: true, name: true, role: true } } },
    });

    // bump updatedAt
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { updatedAt: new Date() },
    });

    // realtime
    await pusher.trigger(convoChannel(convo.publicId), NEW_MESSAGE_EVENT, {
      message: msg,
    });

    return NextResponse.json(msg);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
