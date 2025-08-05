// src/app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session?.user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
