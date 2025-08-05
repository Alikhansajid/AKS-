// // lib/session.ts
// import { SessionOptions, getIronSession } from 'iron-session';
// import { NextRequest, NextResponse } from 'next/server';

// export interface SessionData {
//   user?: {
//     publicId: string;
//     email: string;
//     name: string;
//     phone?: string;
//     profilePic?: string;
//   };
// }




// export const sessionOptions: SessionOptions = {
//   cookieName: 'myapp_session',
//   password: process.env.SESSION_SECRET as string,
//   cookieOptions: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     sameSite: 'lax' as const,
//     path: '/',
//     maxAge: 24 * 60 * 60, 
//   },
// };

// export async function getSession(req: NextRequest) {
//   const res = NextResponse.next();
//   return await getIronSession<SessionData>(req, res, sessionOptions);
// }

// lib/session.ts
import { SessionOptions, getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
    role?: string;
  };
}

export const sessionOptions: SessionOptions = {
  cookieName: 'myapp_session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  },
};

export async function getSession(req: NextRequest) {
  const res = NextResponse.next(); // ✅ Keep this for use in edge/server contexts
  return await getIronSession<SessionData>(req, res, sessionOptions);
}
