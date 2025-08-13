import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';


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

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { role: true },
    });

    if (admin?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, index, approve } = await req.json();

    if (typeof userId !== 'number' || typeof index !== 'number' || typeof approve !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, details: true },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'User not found or not a rider' }, { status: 404 });
    }

    const currentDetails = (user.details as RiderDetails | undefined) || {};
    const pendingDetails = currentDetails.pendingDetails || [];

    if (index < 0 || index >= pendingDetails.length) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
    }

    let updatedDetails: RiderDetails;
    const newPending = [...pendingDetails];
    const selected = newPending.splice(index, 1)[0];

    if (approve) {
      updatedDetails = {
        ...currentDetails,
        address: selected.address,
        cnic: selected.cnic,
        vehicleType: selected.vehicleType,
        vehicleNumber: selected.vehicleNumber,
        pendingDetails: newPending.length > 0 ? newPending : [],
      };
    } else {
      updatedDetails = {
        ...currentDetails,
        pendingDetails: newPending.length > 0 ? newPending : [],
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { details: updatedDetails },
    });

    return NextResponse.json({ message: 'Action completed successfully' });
  } catch (error) {
    console.error('Approve rider details error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}