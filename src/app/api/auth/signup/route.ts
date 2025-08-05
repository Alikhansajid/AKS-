// // app/api/auth/signup/route.ts
// import { getIronSession } from 'iron-session';
// import { NextRequest, NextResponse } from 'next/server';
// import { sessionOptions, SessionData } from '@/lib/session';
// import { prisma } from '@/lib/prisma';
// import bcrypt from 'bcrypt';
// import { nanoid } from 'nanoid';

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password, name, phone } = await req.json();
//     const response = NextResponse.next(); // Create response object
//     const session = await getIronSession<SessionData>(req, response, sessionOptions);

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return NextResponse.json({ error: 'User already exists' }, { status: 400 });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await prisma.user.create({
//       data: {
//         publicId: nanoid(),
//         email,
//         name,
//         phone: phone || null,
//         password: hashedPassword,
//       },
//     });

//     session.user = {
//       publicId: user.publicId,
//       email: user.email,
//       name: user.name,
//       phone: user.phone || undefined,
//       profilePic: user.profilePicture || undefined,
//     };
//     await session.save();
//     console.log('Session saved:', session.user);

//     return NextResponse.json({ user: session.user, redirect: '/' }, { status: 201, headers: response.headers });
//   } catch (error) {
//     console.error('Signup error:', error);
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }


// app/api/auth/signup/route.ts
import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone } = await req.json();
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(req, response, sessionOptions);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        publicId: nanoid(),
        email,
        name,
        phone: phone || null,
        password: hashedPassword,
      },
    });

    session.user = {
      publicId: user.publicId,
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      profilePic: user.profilePic || undefined,
    };
    await session.save();
    console.log('Session saved:', session.user);

    // Explicitly set the cookie in the response
    const cookie = response.headers.get('set-cookie');
    const finalResponse = NextResponse.json({ user: session.user, redirect: '/' }, { status: 201 });
    if (cookie) {
      finalResponse.headers.set('set-cookie', cookie);
    }

    return finalResponse;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}