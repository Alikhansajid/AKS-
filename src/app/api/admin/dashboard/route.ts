import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session';
import { subWeeks, subMonths, subYears } from 'date-fns';
import { Role, OrderStatus, PaymentStatus } from '@/types/enums';

interface IronSessionData {
  user?: {
    publicId: string;
    role?: Role;
  };
}

type Timeframe = '1w' | '1m' | '1y' | 'lifetime';

interface DashboardData {
  timeframe: Timeframe;

  // top cards
  ridersCount: number;
  customersCount: number;
  totalOrders: number;
  totalRevenue: number;

  // charts
  ordersByStatus: { status: OrderStatus; _count: { status: number } }[];
  ordersByCategory: { categoryName: string; orderCount: number }[];
  paymentsByStatusOverTime: { bucket: string; status: PaymentStatus; count: number }[];
  revenueOverTime: { bucket: string; totalRevenue: number }[];

  // tables
  riderLeaderboard: { riderName: string; completionRate: number; totalDeliveries: number }[];
  topCustomers: { customerName: string; orders: number; totalSpent: number }[];
}

// map-safe helpers (no `any`)
function toOrderStatus(value: string): OrderStatus {
  if (Object.values(OrderStatus).includes(value as OrderStatus)) {
    return value as OrderStatus;
  }
  throw new Error(`Unknown OrderStatus: ${value}`);
}
function toPaymentStatus(value: string): PaymentStatus {
  if (Object.values(PaymentStatus).includes(value as PaymentStatus)) {
    return value as PaymentStatus;
  }
  throw new Error(`Unknown PaymentStatus: ${value}`);
}

export async function GET(req: NextRequest) {
  try {
    // --- Auth check ---
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { role: true },
    });
    if (!me || me.role !== Role.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // --- Timeframe ---
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') || 'lifetime') as Timeframe;

    const endDate = new Date();
    let startDate: Date | undefined;
    switch (timeframe) {
      case '1w':
        startDate = subWeeks(endDate, 1);
        break;
      case '1m':
        startDate = subMonths(endDate, 1);
        break;
      case '1y':
        startDate = subYears(endDate, 1);
        break;
      case 'lifetime':
      default:
        startDate = undefined;
        break;
    }
    const dateFilter = startDate ? { gte: startDate, lte: endDate } : undefined;

    // --- Topline counts ---
    const [ridersCount, customersCount, totalOrders] = await Promise.all([
      prisma.user.count({ where: { role: Role.RIDER } }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.order.count({ where: dateFilter ? { updatedAt: dateFilter } : {} }),
    ]);

    // Total Revenue (sum of order items where payment SUCCESS)
    const totalRevenueRows = startDate
      ? await prisma.$queryRaw<
          { totalrevenue: number | null }[]
        >`
          SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS totalrevenue
          FROM "payment" pay
          JOIN "order" o ON o.id = pay."orderId"
          JOIN "order_item" oi ON oi."orderId" = o.id
          WHERE pay.status = 'SUCCESS'
            AND pay."created_at" BETWEEN ${startDate}::timestamptz AND ${endDate}::timestamptz
        `
      : await prisma.$queryRaw<
          { totalrevenue: number | null }[]
        >`
          SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS totalrevenue
          FROM "payment" pay
          JOIN "order" o ON o.id = pay."orderId"
          JOIN "order_item" oi ON oi."orderId" = o.id
          WHERE pay.status = 'SUCCESS'
        `;
    const totalRevenue = Number(totalRevenueRows[0]?.totalrevenue ?? 0);

    // Orders by Status
    const rawOrdersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: dateFilter ? { updatedAt: dateFilter } : {},
      _count: { status: true },
    });
    const ordersByStatus = rawOrdersByStatus.map((r) => ({
      status: toOrderStatus(String(r.status)),
      _count: { status: r._count.status },
    }));

    // Orders by Category (use DB column names where mapped)
    const ordersByCategoryRows = startDate
      ? await prisma.$queryRaw<
          { categoryname: string; ordercount: number }[]
        >`
          SELECT
            c.name AS categoryname,
            CAST(COUNT(DISTINCT o.id) AS INT) AS ordercount
          FROM "order" o
          JOIN "order_item" oi ON o.id = oi."orderId"
          JOIN "product" p ON oi."productId" = p.id
          JOIN "category" c ON p."categoryId" = c.id
          WHERE o."updated_at" BETWEEN ${startDate}::timestamptz AND ${endDate}::timestamptz
          GROUP BY c.name
        `
      : await prisma.$queryRaw<
          { categoryname: string; ordercount: number }[]
        >`
          SELECT
            c.name AS categoryname,
            CAST(COUNT(DISTINCT o.id) AS INT) AS ordercount
          FROM "order" o
          JOIN "order_item" oi ON o.id = oi."orderId"
          JOIN "product" p ON oi."productId" = p.id
          JOIN "category" c ON p."categoryId" = c.id
          GROUP BY c.name
        `;
    const ordersByCategory = ordersByCategoryRows.map((r) => ({
      categoryName: r.categoryname,
      orderCount: Number(r.ordercount ?? 0),
    }));

    // Payments by Status over Time (bucket by day)
    const paymentsRows = startDate
      ? await prisma.$queryRaw<
          { bucket: string; status: string; count: number }[]
        >`
          SELECT
            to_char(date_trunc('day', pay."created_at"), 'YYYY-MM-DD') AS bucket,
            pay.status::text AS status,
            CAST(COUNT(*) AS INT) AS count
          FROM "payment" pay
          WHERE pay."created_at" BETWEEN ${startDate}::timestamptz AND ${endDate}::timestamptz
          GROUP BY 1, 2
          ORDER BY 1 ASC
        `
      : await prisma.$queryRaw<
          { bucket: string; status: string; count: number }[]
        >`
          SELECT
            to_char(date_trunc('day', pay."created_at"), 'YYYY-MM-DD') AS bucket,
            pay.status::text AS status,
            CAST(COUNT(*) AS INT) AS count
          FROM "payment" pay
          GROUP BY 1, 2
          ORDER BY 1 ASC
        `;
    const paymentsByStatusOverTime = paymentsRows.map((r) => ({
      bucket: r.bucket,
      status: toPaymentStatus(r.status),
      count: Number(r.count ?? 0),
    }));

    // Revenue Over Time (sum of items where payment SUCCESS, bucket by day)
    const revenueRows = startDate
      ? await prisma.$queryRaw<
          { bucket: string; totalrevenue: number }[]
        >`
          SELECT
            to_char(date_trunc('day', pay."created_at"), 'YYYY-MM-DD') AS bucket,
            COALESCE(SUM(oi.quantity * oi.price), 0) AS totalrevenue
          FROM "payment" pay
          JOIN "order" o ON o.id = pay."orderId"
          JOIN "order_item" oi ON oi."orderId" = o.id
          WHERE pay.status = 'SUCCESS'
            AND pay."created_at" BETWEEN ${startDate}::timestamptz AND ${endDate}::timestamptz
          GROUP BY 1
          ORDER BY 1 ASC
        `
      : await prisma.$queryRaw<
          { bucket: string; totalrevenue: number }[]
        >`
          SELECT
            to_char(date_trunc('day', pay."created_at"), 'YYYY-MM-DD') AS bucket,
            COALESCE(SUM(oi.quantity * oi.price), 0) AS totalrevenue
          FROM "payment" pay
          JOIN "order" o ON o.id = pay."orderId"
          JOIN "order_item" oi ON oi."orderId" = o.id
          WHERE pay.status = 'SUCCESS'
          GROUP BY 1
          ORDER BY 1 ASC
        `;
    const revenueOverTime = revenueRows.map((r) => ({
      bucket: r.bucket,
      totalRevenue: Number(r.totalrevenue ?? 0),
    }));

    // Rider leaderboard
    const riders = await prisma.user.findMany({
      where: { role: Role.RIDER },
      select: { id: true, name: true },
    });
    const riderLeaderboard = await Promise.all(
      riders.map(async (r) => {
        const [totalAssigned, totalDelivered] = await Promise.all([
          prisma.order.count({
            where: { riderId: r.id, ...(dateFilter ? { updatedAt: dateFilter } : {}) },
          }),
          prisma.order.count({
            where: {
              riderId: r.id,
              status: OrderStatus.DELIVERED,
              ...(dateFilter ? { updatedAt: dateFilter } : {}),
            },
          }),
        ]);
        return {
          riderName: r.name,
          completionRate: totalAssigned === 0 ? 0 : totalDelivered / totalAssigned,
          totalDeliveries: totalDelivered,
        };
      })
    );

    // Top customers (by orders and spend)
    const topCustomersRows = startDate
      ? await prisma.$queryRaw<
          { customername: string; orders: number; totalspent: number }[]
        >`
          SELECT
            u.name AS customername,
            CAST(COUNT(DISTINCT o.id) AS INT) AS orders,
            COALESCE(SUM(oi.quantity * oi.price), 0) AS totalspent
          FROM "order" o
          JOIN "user" u ON u.id = o."userId"
          LEFT JOIN "order_item" oi ON oi."orderId" = o.id
          LEFT JOIN "payment" pay ON pay."orderId" = o.id AND pay.status = 'SUCCESS'
          WHERE o."updated_at" BETWEEN ${startDate}::timestamptz AND ${endDate}::timestamptz
          GROUP BY u.name
          ORDER BY totalspent DESC NULLS LAST
          LIMIT 5
        `
      : await prisma.$queryRaw<
          { customername: string; orders: number; totalspent: number }[]
        >`
          SELECT
            u.name AS customername,
            CAST(COUNT(DISTINCT o.id) AS INT) AS orders,
            COALESCE(SUM(oi.quantity * oi.price), 0) AS totalspent
          FROM "order" o
          JOIN "user" u ON u.id = o."userId"
          LEFT JOIN "order_item" oi ON oi."orderId" = o.id
          LEFT JOIN "payment" pay ON pay."orderId" = o.id AND pay.status = 'SUCCESS'
          GROUP BY u.name
          ORDER BY totalspent DESC NULLS LAST
          LIMIT 5
        `;
    const topCustomers = topCustomersRows.map((r) => ({
      customerName: r.customername,
      orders: Number(r.orders ?? 0),
      totalSpent: Number(r.totalspent ?? 0),
    }));

    const data: DashboardData = {
      timeframe,
      ridersCount,
      customersCount,
      totalOrders,
      totalRevenue,
      ordersByStatus,
      ordersByCategory,
      paymentsByStatusOverTime,
      revenueOverTime,
      riderLeaderboard,
      topCustomers,
    };

    return NextResponse.json(data);
  } catch (e) {
    console.error('Error in /api/admin/dashboard:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}











