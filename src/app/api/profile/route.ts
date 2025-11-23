// import { prisma } from '@/lib/prisma';
// import { getIronSession } from 'iron-session';
// import { sessionOptions } from '@/lib/session';
// import { NextRequest, NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import { cloudinary } from '@/lib/cloudinary';
// import streamifier from 'streamifier';

// interface SessionUser {
//   publicId: string;
//   email: string;
//   name: string;
//   phone?: string;
//   profilePic?: string;
// }

// interface SessionData {
//   user?: SessionUser;
// }

// export async function PUT(req: NextRequest) {
//   try {
//     const response = NextResponse.json({ message: 'Profile update temp' });
//     const session = await getIronSession<SessionData>(req, response, sessionOptions);

//     if (!session.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const formData = await req.formData();
//     const name = formData.get('name') as string;
//     const phone = formData.get('phone') as string;
//     const password = formData.get('password') as string;
//     const profilePic = formData.get('profilePic') as File | null;

//     const updateData: Record<string, unknown> = {
//       name,
//       phone: phone || null,
//     };

//     if (password) {
//       updateData.password = await bcrypt.hash(password, 10);
//     }

//     if (profilePic && profilePic.size > 0) {
//       const arrayBuffer = await profilePic.arrayBuffer();
//       const buffer = Buffer.from(arrayBuffer);
//       const timestamp = Date.now();

//       const uploaded = await new Promise<string>((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           {
//             folder: `profile_pictures/${session.user!.publicId}`,
//             public_id: `image-${timestamp}`,
//             resource_type: 'image',
//             use_filename: false,
//             unique_filename: false,
//           },
//           (err, result) => {
//             if (err || !result) return reject(err);
//             resolve(result.secure_url);
//           }
//         );
//         streamifier.createReadStream(buffer).pipe(stream);
//       });

//       updateData.profilePic = uploaded;
//     }

//     const updatedUser = await prisma.user.update({
//       where: { publicId: session.user.publicId },
//       data: updateData,
//     });

//     session.user = {
//       publicId: updatedUser.publicId,
//       email: updatedUser.email,
//       name: updatedUser.name,
//       phone: updatedUser.phone || undefined,
//       profilePic: updatedUser.profilePic || undefined,
//     };

//     await session.save();

//     return NextResponse.json({ message: 'Profile updated successfully' });
//   } catch (error) {
//     console.error('Profile update error:', error);
//     return NextResponse.json({ error: 'Update failed' }, { status: 500 });
//   }
// }












import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cloudinary } from '@/lib/cloudinary';
import sharp from 'sharp';
import retry from 'async-retry';

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

// Utility to enforce a timeout for promises
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeout]);
};

// Test Cloudinary connectivity
const testCloudinaryConnectivity = async (): Promise<boolean> => {
  try {
    await withTimeout(cloudinary.api.ping(), 5000); // 5-second timeout for ping
    console.log('Cloudinary connectivity test: Success');
    return true;
  } catch (error) {
    console.error('Cloudinary connectivity test failed:', error);
    return false;
  }
};

// Global unhandled rejection handler (temporary for debugging)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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

    // Validate inputs
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      name,
      phone: phone || null,
    };

    if (password) {
      try {
        updateData.password = await bcrypt.hash(password, 10);
      } catch (bcryptError) {
        console.error('Password hashing error:', bcryptError);
        return NextResponse.json({ error: 'Failed to process password' }, { status: 500 });
      }
    }

    if (profilePic && profilePic.size > 0) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(profilePic.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
          { status: 400 }
        );
      }

      if (profilePic.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
      }

      // Resize image with sharp
      let buffer: Buffer;
      try {
        const arrayBuffer = await profilePic.arrayBuffer();
        console.log('Original file size:', arrayBuffer.byteLength);
        buffer = await withTimeout(
          sharp(Buffer.from(arrayBuffer))
            .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer(),
          5000 // 5-second timeout for image processing
        );
        console.log('Buffer size after resizing:', buffer.length);
      } catch (sharpError) {
        console.error('Image processing error:', sharpError);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 400 });
      }

      const timestamp = Date.now();

      // Test Cloudinary connectivity
      const isCloudinaryConnected = await testCloudinaryConnectivity();
      if (!isCloudinaryConnected) {
        console.warn('Skipping upload due to Cloudinary connectivity failure');
      } else {
        // Upload to Cloudinary with retry logic
        try {
          const uploaded = await withTimeout(
            retry(
              async () => {
                try {
                  const result = await cloudinary.uploader.upload(
                    `data:image/jpeg;base64,${buffer.toString('base64')}`,
                    {
                      folder: `profile_pictures/${session.user!.publicId}`,
                      public_id: `image-${timestamp}`,
                      resource_type: 'image',
                      use_filename: false,
                      unique_filename: false,
                    }
                  );
                  return result.secure_url;
                } catch (error) {
                  console.error('Cloudinary upload attempt failed:', error);
                  throw error; // Rethrow to trigger retry
                }
              },
              {
                retries: 3,
                factor: 2,
                minTimeout: 1000,
                maxTimeout: 3000,
                onRetry: (err) => console.log('Retrying upload due to:', err.message),
              }
            ),
            15000 // 15-second total timeout for all retries
          );

          // Delete old profile picture if it exists
          if (session.user.profilePic) {
            const publicId = session.user.profilePic.split('/').pop()?.split('.')[0];
            if (publicId) {
              try {
                await cloudinary.uploader.destroy(`profile_pictures/${session.user.publicId}/${publicId}`);
                console.log('Old profile picture deleted');
              } catch (destroyError) {
                console.error('Failed to delete old profile picture:', destroyError);
                // Continue despite deletion failure
              }
            }
          }

          updateData.profilePic = uploaded;
        } catch (uploadError) {
          console.error('Cloudinary upload failed after retries:', uploadError);
          console.warn('Skipping profile picture update due to Cloudinary failure');
        }
      }
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

    return NextResponse.json({
      message: updateData.profilePic
        ? 'Profile updated successfully'
        : 'Profile updated successfully, but image upload failed',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}