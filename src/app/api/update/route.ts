import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import path from 'path';

interface SessionUser {
  publicId: string;
  email: string;
  name: string;
  phone?: string;
  profilePic?: string;
}

interface SessionData {
  user?: SessionUser;
}

export async function PUT(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Temp' });

    const session = await getIronSession<SessionData>(req, response, sessionOptions);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const profilePic = formData.get('profilePic') as File | null;

    let profilePicPath: string | undefined;
    if (profilePic && profilePic.size > 0) {
      const fileName = `${session.user.publicId}-${Date.now()}.${profilePic.name.split('.').pop()}`;
      const filePath = path.join(process.cwd(), 'public/uploads', fileName);
      const buffer = Buffer.from(await profilePic.arrayBuffer());
      await writeFile(filePath, buffer);
      profilePicPath = `/uploads/${fileName}`;
    }

    const updateData: Record<string, unknown> = {
      name,
      phone: phone || null,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (profilePicPath) {
      updateData.profilePicture = profilePicPath;
    }

    const updatedUser = await prisma.user.update({
      where: { publicId: session.user.publicId },
      data: updateData,
    });

    session.user = {
      publicId: updatedUser.publicId,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone || undefined,
      profilePic: updatedUser.profilePic || undefined,
    };

    await session.save();

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
