// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/session';

// export async function GET(req: NextRequest) {
//   try {
//     const session = await getSession(req);
//     const user = session?.user;
//     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//     const conversations = await prisma.conversation.findMany({
//       where: {
//         participants: { some: { user: { publicId: user.publicId } } },
//       },
//       select: {
//         participants: {
//           select: { user: { select: { publicId: true, name: true, role: true } } },
//         },
//         messages: {
//           orderBy: { createdAt: 'desc' },
//           take: 1,
//           select: { sender: { select: { publicId: true, name: true } } },
//         },
//       },
//       orderBy: { updatedAt: 'desc' },
//     });

//     return NextResponse.json(conversations);
//   } catch (err) {
//     return NextResponse.json({ error: (err as Error).message }, { status: 500 });
//   }
// }












import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { user: { publicId: user.publicId } },
        },
      },
      select: {
        publicId: true,
        participants: {
          select: {
            user: { select: { publicId: true, name: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            publicId: true,
            content: true, // ✅ include the text
            createdAt: true,
            sender: {
              select: { publicId: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
