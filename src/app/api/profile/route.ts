import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cloudinary } from '@/lib/cloudinary';
import streamifier from 'streamifier';

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
    const response = NextResponse.json({ message: 'Profile update temp' });
    const session = await getIronSession<SessionData>(req, response, sessionOptions);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const profilePic = formData.get('profilePic') as File | null;

    const updateData: Record<string, unknown> = {
      name,
      phone: phone || null,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (profilePic && profilePic.size > 0) {
      const arrayBuffer = await profilePic.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const timestamp = Date.now();

      const uploaded = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `profile_pictures/${session.user!.publicId}`,
            public_id: `image-${timestamp}`,
            resource_type: 'image',
            use_filename: false,
            unique_filename: false,
          },
          (err, result) => {
            if (err || !result) return reject(err);
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

      updateData.profilePic = uploaded;
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
