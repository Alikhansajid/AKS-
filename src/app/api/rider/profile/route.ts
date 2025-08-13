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
      select: {
        publicId: true,
        email: true,
        name: true,
        phone: true,
        profilePic: true,
        role: true,
        details: true,
      },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'User is not a rider' }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        publicId: user.publicId,
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
        profilePic: user.profilePic || undefined,
        details: user.details || undefined,
      },
    });
  } catch (error) {
    console.error('Rider profile fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}