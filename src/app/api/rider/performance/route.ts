import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { subDays, subWeeks, subMonths, subYears, format } from 'date-fns';

interface IronSessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'User is not a rider' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') as 'today' | 'lastWeek' | 'lastMonth' | 'lastYear' | 'lifetime' | null;

    let labels: string[] = [];
    let data: number[] = [];
    let startDate: Date;
    const endDate = new Date();

    if (range === 'today') {
      startDate = subDays(endDate, 1);
      const orders = await prisma.order.findMany({
        where: {
          riderId: user.id,
          status: 'DELIVERED',
          updatedAt: { gte: startDate, lte: endDate },
        },
        select: { updatedAt: true },
      });
      labels = ['00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-23:59'];
      data = labels.map((_, index) => {
        const startHour = index * 6;
        const endHour = (index + 1) * 6;
        return orders.filter(order => {
          const hour = new Date(order.updatedAt).getHours();
          return hour >= startHour && hour < endHour;
        }).length;
      });
    } else if (range === 'lastWeek') {
      startDate = subWeeks(endDate, 1);
      const orders = await prisma.order.findMany({
        where: {
          riderId: user.id,
          status: 'DELIVERED',
          updatedAt: { gte: startDate, lte: endDate },
        },
        select: { updatedAt: true },
      });
      labels = Array.from({ length: 7 }, (_, i) => format(subDays(endDate, 6 - i), 'EEE'));
      data = labels.map((_, index) => {
        const day = subDays(endDate, 6 - index);
        return orders.filter(order => format(new Date(order.updatedAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
      });
    } else if (range === 'lastMonth') {
      startDate = subMonths(endDate, 1);
      const orders = await prisma.order.findMany({
        where: {
          riderId: user.id,
          status: 'DELIVERED',
          updatedAt: { gte: startDate, lte: endDate },
        },
        select: { updatedAt: true },
      });
      labels = Array.from({ length: 4 }, (_, i) => format(subDays(endDate, (3 - i) * 7), 'MMM dd'));
      data = labels.map((_, index) => {
        const start = subDays(endDate, (3 - index) * 7);
        const end = index === 3 ? endDate : subDays(endDate, (2 - index) * 7);
        return orders.filter(order => new Date(order.updatedAt) >= start && new Date(order.updatedAt) < end).length;
      });
    } else if (range === 'lastYear') {
      startDate = subYears(endDate, 1);
      const orders = await prisma.order.findMany({
        where: {
          riderId: user.id,
          status: 'DELIVERED',
          updatedAt: { gte: startDate, lte: endDate },
        },
        select: { updatedAt: true },
      });
      labels = Array.from({ length: 12 }, (_, i) => format(subMonths(endDate, 11 - i), 'MMM'));
      data = labels.map((_, index) => {
        const month = subMonths(endDate, 11 - index);
        return orders.filter(order => format(new Date(order.updatedAt), 'yyyy-MM') === format(month, 'yyyy-MM')).length;
      });
    } else {
      const orders = await prisma.order.findMany({
        where: {
          riderId: user.id,
          status: 'DELIVERED',
        },
        select: { updatedAt: true },
      });
      const years = [...new Set(orders.map(order => new Date(order.updatedAt).getFullYear()))].sort();
      labels = years.map(year => year.toString());
      data = labels.map(year => orders.filter(order => new Date(order.updatedAt).getFullYear() === parseInt(year)).length);
    }

    return NextResponse.json({ labels, data });
  } catch (error) {
    console.error('Rider performance fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}