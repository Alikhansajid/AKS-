import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface IronSessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const riders = await prisma.user.findMany({
      where: { role: 'RIDER', deletedAt: null },
      select: { id: true, name: true },
    });

    return NextResponse.json({ riders });
  } catch (error) {
    console.error('Riders fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}