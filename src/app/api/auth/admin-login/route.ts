import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// ⛳ Force Node.js runtime to allow cookie setting
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { adminKey } = await req.json();

  console.log('🚨 adminKey from request:', adminKey);
  const ADMIN_KEY_HASH = '$2b$10$hnEozvwYG5.9nQOcMSb9U.Y5sXsSye9LdqbUy9AUAxjhELJOcP.ZS';

  console.log('🔑 ADMIN_KEY_HASH from .env:', ADMIN_KEY_HASH);

  if (!adminKey) {
    return NextResponse.json({ error: 'Missing admin key' }, { status: 400 });
  }

  if (!ADMIN_KEY_HASH) {
    return NextResponse.json({ error: 'ADMIN_KEY_HASH not configured' }, { status: 500 });
  }

  try {
    const isValid = await bcrypt.compare(adminKey, ADMIN_KEY_HASH);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }
  } catch (err) {
    console.error('❌ bcrypt.compare failed:', err);
    return NextResponse.json({ error: 'Internal error during admin key check' }, { status: 500 });
  }
  console.log('✅ process.env keys:', Object.keys(process.env));
console.log('🔑 ADMIN_KEY_HASH from process.env:', process.env.ADMIN_KEY_HASH);
console.log('🌍 All env keys:', Object.keys(process.env));
console.log('📦 Full env:', JSON.stringify(process.env, null, 2));


  console.log('✅ Loaded hash:', process.env.ADMIN_KEY_HASH);
  console.log('✅ Admin key is valid, proceeding with login...');
  console.log('🔑 ADMIN_KEY_HASH from .env:', process.env.ADMIN_KEY_HASH?.slice(0, 10)); // just for safety

  let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Admin',
        email: `admin-${Date.now()}@admin.local`,
        password: '',
        phone: '',
        role: 'ADMIN',
      },
    });
  }

  const res = NextResponse.json({ user: { publicId: user.publicId, role: user.role } });

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.user = {
    publicId: user.publicId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  await session.save();

  return res;
}
