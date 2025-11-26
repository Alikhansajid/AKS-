import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = await params;

    const category = await prisma.category.findUnique({
      where: { publicId, deletedAt: null },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category has subcategories or products
    const hasSubcategories = await prisma.category.count({
      where: { parentId: category.id, deletedAt: null },
    });
    const hasProducts = await prisma.product.count({
      where: { categoryId: category.id, deletedAt: null },
    });

    if (hasSubcategories > 0 || hasProducts > 0) {
      return NextResponse.json({ error: 'Cannot delete category with subcategories or products' }, { status: 400 });
    }

    await prisma.category.update({
  where: { publicId },
  data: { deletedAt: new Date(), updatedById: session.user.publicId ? parseInt(session.user.publicId as string) : null },
});

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
