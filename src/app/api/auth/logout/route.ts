// app/api/auth/logout/route.ts
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

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  const session = await getIronSession<IronSessionData>(req, res, sessionOptions);
  await session.destroy();
  return res;
}
