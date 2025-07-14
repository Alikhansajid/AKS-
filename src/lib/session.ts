// lib/session.ts
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

// Define the shape of the session data
interface SessionData {
  user?: {
    publicId: string;
    email: string;
    name: string | null;
  };
}

// Define session options
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'my-app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 14, // 14 days
  },
};

// Extend the IronSession type to include the user property
type IronSession = Awaited<ReturnType<typeof getIronSession>> & SessionData;

export async function getSession(req: NextRequest | Request, res: NextResponse | Response): Promise<IronSession> {
  return getIronSession(req, res, sessionOptions) as Promise<IronSession>;
}