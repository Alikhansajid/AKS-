// app/api/auth/session/route.ts
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';

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
    const session: IronSessionData = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    return NextResponse.json({ user: session.user ?? null });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}