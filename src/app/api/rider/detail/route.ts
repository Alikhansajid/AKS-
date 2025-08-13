// import { getIronSession } from 'iron-session';
// import { NextRequest, NextResponse } from 'next/server';
// import { sessionOptions } from '@/lib/session';
// import { prisma } from '@/lib/prisma';

// // Fallback JSON types for Prisma
// type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
// interface JsonObject {
//   [key: string]: JsonValue;
// }
// interface JsonArray extends Array<JsonValue> {}

// interface IronSessionData {
//   user?: {
//     publicId: string;
//     email: string;
//     name: string;
//     phone?: string;
//     profilePic?: string;
//   };
// }

// interface RiderDetails {
//   address?: string;
//   cnic?: string;
//   vehicleType?: string;
//   vehicleNumber?: string;
//   pendingDetails?: RiderDetails[];
//   [key: string]: JsonValue | undefined | RiderDetails[];
// }

// export async function PATCH(req: NextRequest) {
//   try {
//     const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
//     if (!session.user?.publicId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { pendingDetails } = await req.json();

//     if (!pendingDetails || !pendingDetails.address || !pendingDetails.cnic || !pendingDetails.vehicleType || !pendingDetails.vehicleNumber) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { publicId: session.user.publicId },
//       select: { id: true, role: true, details: true },
//     });

//     if (!user || user.role !== 'RIDER') {
//       return NextResponse.json({ error: 'User is not a rider' }, { status: 403 });
//     }

//     const currentDetails = (user.details as RiderDetails | undefined) || {};
//     const newPendingDetails: RiderDetails = {
//       address: pendingDetails.address,
//       cnic: pendingDetails.cnic,
//       vehicleType: pendingDetails.vehicleType,
//       vehicleNumber: pendingDetails.vehicleNumber,
//     };

//     // Ensure pendingDetails is an array, initialize as empty array if undefined
//     const updatedPendingDetails = [
//       ...(currentDetails.pendingDetails || []),
//       newPendingDetails,
//     ];

//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         details: {
//           ...currentDetails,
//           pendingDetails: updatedPendingDetails,
//         },
//       },
//     });

//     return NextResponse.json({ message: 'Pending rider details submitted successfully' });
//   } catch (error) {
//     console.error('Rider details update error:', error);
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }

import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Fallback JSON types for Prisma
type JsonValue = string | number | boolean | null | JsonObject | Array<JsonValue>;
interface JsonObject {
  [key: string]: JsonValue;
}

interface IronSessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
  };
}

interface RiderDetails {
  address?: string;
  cnic?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  pendingDetails?: RiderDetails[];
  [key: string]: JsonValue | undefined | RiderDetails[];
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pendingDetails } = await req.json();

    if (!pendingDetails || !pendingDetails.address || !pendingDetails.cnic || !pendingDetails.vehicleType || !pendingDetails.vehicleNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { id: true, role: true, details: true },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'User is not a rider' }, { status: 403 });
    }

    const currentDetails = (user.details as RiderDetails | undefined) || {};
    const newPendingDetails: RiderDetails = {
      address: pendingDetails.address,
      cnic: pendingDetails.cnic,
      vehicleType: pendingDetails.vehicleType,
      vehicleNumber: pendingDetails.vehicleNumber,
    };

    // Ensure pendingDetails is an array, initialize as empty array if undefined
    const updatedPendingDetails = [
      ...(currentDetails.pendingDetails || []),
      newPendingDetails,
    ];

    await prisma.user.update({
      where: { id: user.id },
      data: {
        details: {
          ...currentDetails,
          pendingDetails: updatedPendingDetails,
        },
      },
    });

    return NextResponse.json({ message: 'Pending rider details submitted successfully' });
  } catch (error) {
    console.error('Rider details update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}