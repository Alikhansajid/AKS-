import { SessionOptions, getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

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
  cookieName: "myapp_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  },
};

// ✅ for pages/api or API routes using NextRequest
export async function getSession(req: NextRequest) {
  const res = NextResponse.next();
  return getIronSession<SessionData>(req, res, sessionOptions);
}

// ✅ for app router route.ts files (where you get plain Request)
export async function getSessionFromRequest(request: Request) {
  const req = request as unknown as NextRequest;
  const res = NextResponse.next();
  return getIronSession<SessionData>(req, res, sessionOptions);
}
