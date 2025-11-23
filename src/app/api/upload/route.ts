import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import sharp from 'sharp';
import retry from 'async-retry';

// Define the Cloudinary upload result type
interface CloudinaryUploadResult {
  secure_url: string;
}

// Utility to enforce a timeout for promises
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
};

// Test Cloudinary connectivity (for debugging only)
const testCloudinaryConnectivity = async (): Promise<boolean> => {
  try {
    await withTimeout(cloudinary.api.ping(), 15000); // Increased to 15-second timeout
    console.log('Cloudinary connectivity test: Success');
    return true;
  } catch (error) {
    console.error('Cloudinary connectivity test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    });
    return false;
  }
};

// Global unhandled rejection handler (temporary for debugging)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', JSON.stringify(reason, Object.getOwnPropertyNames(reason), 2));
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.type.startsWith('image/') || file.size === 0) {
      return NextResponse.json(
        { error: 'Invalid image file. Please upload a valid image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    // Resize image to reduce upload time
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('Original file size:', arrayBuffer.byteLength);
      buffer = await withTimeout(
        sharp(Buffer.from(arrayBuffer))
          .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer(),
        15000 // Increased to 15-second timeout for image processing
      );
      console.log('Buffer size after resizing:', buffer.length);
    } catch (error) {
      console.error('Image processing failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      });
      return NextResponse.json(
        { error: 'Failed to process image.', displayUrl: '/images/placeholder.jpg' },
        { status: 400 }
      );
    }

    // Attempt upload to Cloudinary with retry
    let uploadResult: CloudinaryUploadResult;
    try {
      const timestamp = Date.now();
      uploadResult = await withTimeout(
        retry(
          async () => {
            // Optionally test connectivity for debugging
            const isCloudinaryConnected = await testCloudinaryConnectivity();
            console.log('Connectivity status before upload attempt:', isCloudinaryConnected);

            try {
              const result = await cloudinary.uploader.upload(
                `data:image/jpeg;base64,${buffer.toString('base64')}`,
                {
                  folder: 'group_conversations',
                  public_id: `group-pic-${timestamp}`,
                  resource_type: 'image',
                  use_filename: false,
                  unique_filename: false,
                  timeout: 60000, // Cloudinary SDK timeout
                }
              );
              console.log('Cloudinary upload successful:', result.secure_url);
              return result as CloudinaryUploadResult;
            } catch (error) {
              console.error('Cloudinary upload attempt failed:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
              });
              throw error instanceof Error ? error : new Error(JSON.stringify(error));
            }
          },
          {
            retries: 7, // Increased retries
            factor: 2,
            minTimeout: 3000, // Increased min timeout
            maxTimeout: 10000, // Increased max timeout
            onRetry: (err) => console.log('Retrying upload due to:', err.message || JSON.stringify(err, null, 2)),
          }
        ),
        60000 // Increased to 60-second timeout for entire upload operation
      );
    } catch (error) {
      console.error('Cloudinary upload failed after retries:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      });
      return NextResponse.json(
        { error: 'Failed to upload image to storage service.', displayUrl: '/images/placeholder.jpg' },
        { status: 500 }
      );
    }

    // Return the actual Cloudinary URL for database storage
    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (err) {
    console.error('Upload error:', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      details: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
    });
    return NextResponse.json(
      { error: 'Internal server error during image upload.', displayUrl: '/images/placeholder.jpg' },
      { status: 500 }
    );
  }
}