// import { NextResponse, NextRequest } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/session';

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getSession(request);
//     if (!session.user || session.user.role !== 'ADMIN') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const users = await prisma.user.findMany({
//       where: { deletedAt: null },
//       select: {
//         id: true,
//         publicId: true,
//         name: true,
//         email: true,
//         phone: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//         deletedAt: true,
//       },
//     });

//     return NextResponse.json(users);
//   } catch (error: unknown) {
//     console.error('Error fetching users:', error);
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
//   }
// }









import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        publicId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        details: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    // Return in the shape the frontend expects
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
