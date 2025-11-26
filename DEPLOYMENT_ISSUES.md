# Deployment Issues Summary

This document lists all the issues encountered during Vercel/Cloudflare deployment and how they were resolved.

## Issue 1: Prisma Client Import Path ❌

**Error:** Prisma client was imported from a custom path that doesn't work on Vercel
```typescript
// ❌ Before
import { PrismaClient } from '../../prisma/src/generated/prisma';
```

**Fix:** Updated to use standard Prisma client import
```typescript
// ✅ After
import { PrismaClient } from '@prisma/client';
```

**Files Changed:**
- `prisma/schema.prisma` - Fixed generator output path
- `src/lib/prisma.ts` - Fixed import path

---

## Issue 2: Database Query Errors ❌

**Error:** Invalid `findUnique` query with multiple conditions
```typescript
// ❌ Before
const product = await prisma.product.findUnique({
  where: { publicId, deletedAt: null }, // Invalid - findUnique can't have multiple conditions
});
```

**Fix:** Changed to `findFirst` for queries with multiple conditions
```typescript
// ✅ After
const product = await prisma.product.findFirst({
  where: { 
    publicId,
    deletedAt: null,
  },
});
```

**Files Changed:**
- `src/app/api/products/[publicId]/route.ts`

---

## Issue 3: Next.js 15 Async Params Compatibility ❌

**Error:** Route handlers with dynamic params failed with type errors
```
Type error: Route "src/app/api/admin/categories/[publicId]/route.ts" has an invalid "DELETE" export:
Type "{ params: { publicId: string; }; }" is not a valid type for the function's second argument.
```

**Fix:** Updated all route handlers to use async params (Next.js 15 requirement)
```typescript
// ❌ Before
export async function DELETE(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;
}

// ✅ After
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
}
```

**Files Changed (11 files):**
- `src/app/api/admin/categories/[publicId]/route.ts`
- `src/app/api/admin/orders/[publicId]/route.ts`
- `src/app/api/admin/users/[publicId]/route.ts`
- `src/app/api/cart/[publicId]/route.ts`
- `src/app/api/order/[publicId]/route.ts`
- `src/app/api/conversations/group/[publicId]/admins/route.ts`
- `src/app/api/conversations/group/[publicId]/messages/route.ts`
- `src/app/api/conversations/group/[publicId]/permissions/route.ts`
- `src/app/api/conversations/group/[publicId]/route.ts`
- `src/app/api/conversations/group/route.ts`
- `src/app/api/admin/products/route.ts` (removed params, gets from formData)

---

## Issue 4: ESLint Errors - Unused Parameters ❌

**Error:**
```
./src/app/api/products/route.ts
5:27  Error: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
```

**Fix:** Removed unused parameter
```typescript
// ❌ Before
export async function GET(request: Request) {

// ✅ After
export async function GET() {
```

**Files Changed:**
- `src/app/api/products/route.ts`

---

## Issue 5: ESLint Errors - TypeScript `any` Type ❌

**Error:**
```
./src/app/cart/page.tsx
331:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
```

**Fix:** Changed to `unknown` with proper type checking
```typescript
// ❌ Before
} catch (err: any) {
  toast.error(err.message || 'Invalid coupon');
}

// ✅ After
} catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : 'Invalid coupon';
  toast.error(errorMessage);
}
```

**Files Changed:**
- `src/app/cart/page.tsx`

---

## Issue 6: Deprecated Next.js Config Option ❌

**Error:**
```
⚠ Invalid next.config.ts options detected:
⚠     Unrecognized key(s) in object: 'swcMinify'
```

**Fix:** Removed deprecated `swcMinify` option (enabled by default in Next.js 15)
```typescript
// ❌ Before
const nextConfig: NextConfig = {
  swcMinify: true, // Deprecated
  compress: true,
};

// ✅ After
const nextConfig: NextConfig = {
  compress: true, // swcMinify is enabled by default
};
```

**Files Changed:**
- `next.config.ts`

---

## Issue 7: Unused Variables in Catch Blocks ❌

**Error:**
```
./src/app/api/conversations/group/[publicId]/admins/route.ts
81:11  Error: 'publicIdForError' is assigned a value but never used.
```

**Fix:** Moved variable declaration to function scope
```typescript
// ❌ Before
export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const publicIdForError = publicId; // Unused
    // ...
  } catch (err) {
    console.error({ publicId: publicIdForError }); // Not accessible
  }
}

// ✅ After
export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  let publicId: string | undefined;
  try {
    const resolvedParams = await params;
    publicId = resolvedParams.publicId;
    // ...
  } catch (err) {
    console.error({ publicId: publicId || 'unknown' });
  }
}
```

**Files Changed (5 files):**
- `src/app/api/conversations/group/[publicId]/admins/route.ts`
- `src/app/api/conversations/group/[publicId]/messages/route.ts`
- `src/app/api/conversations/group/[publicId]/permissions/route.ts`
- `src/app/api/conversations/group/[publicId]/route.ts`
- `src/app/api/conversations/group/route.ts`

---

## Issue 8: Empty Module File ❌

**Error:**
```
Type error: File '/opt/buildhome/repo/src/app/api/conversations/new/route.ts' is not a module.
```

**Problem:** File was completely commented out, so it had no exports and TypeScript didn't recognize it as a module.

**Fix:** Deleted the unused file (functionality exists in `/api/conversations/route.ts`)

**Files Changed:**
- Deleted: `src/app/api/conversations/new/route.ts`

---

## Issue 9: Invalid Page Exports ❌

**Error:**
```
Type error: Page "src/app/product/[publicId]/page.tsx" does not match the required types of a Next.js Page.
"useCart" is not a valid Page export field.
```

**Problem:** Next.js page files can only export:
- Default component (the page)
- Metadata exports (`generateMetadata`, `generateStaticParams`, etc.)

**Fix:** Removed exported functions that aren't valid page exports
```typescript
// ❌ Before
export function useCart() { ... }
export function CartBadge() { ... }
export default function ProductDetail() { ... }

// ✅ After
export default function ProductDetail() { ... }
// (useCart and CartBadge removed - not used)
```

**Files Changed:**
- `src/app/product/[publicId]/page.tsx`

---

## Performance Optimizations Applied ✅

### 1. API Route Caching
- Added HTTP cache headers (60s cache, stale-while-revalidate)
- Reduced database queries

### 2. Database Indexes
- Added indexes on `Product.deletedAt`, `Product.categoryId`, `Product.publicId + deletedAt`
- Added indexes on `Category.deletedAt`, `Category.parentId`

### 3. Query Optimization
- Limited image results per product (5 max)
- Limited total products query (1000 max)
- Disabled query logging in production

### 4. Frontend Optimizations
- Optimized SWR configuration (disabled auto-refresh, added deduplication)
- Added proper cache headers to fetch requests
- Image optimization with Next.js Image component

---

## Build Configuration Fixes ✅

### 1. Package.json Scripts
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Vercel Configuration
Created `vercel.json`:
```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3. Next.js Config
- Removed deprecated `swcMinify`
- Added image optimization
- Added package import optimization

---

## Summary

**Total Issues Fixed:** 9 major issues + performance optimizations

**Files Modified:** ~25 files

**Key Categories:**
1. ✅ Prisma/Database issues (2)
2. ✅ Next.js 15 compatibility (11 route files)
3. ✅ TypeScript/ESLint errors (3)
4. ✅ Build configuration (3)
5. ✅ Performance optimizations (multiple)

**Result:** ✅ Application now builds successfully and is ready for deployment on Vercel/Cloudflare

---

## Prevention Tips

1. **Always test with Next.js 15** - Route params are now async
2. **Don't export non-page components from page files** - Use separate component files
3. **Remove unused code** - Commented code can cause module errors
4. **Use proper TypeScript types** - Avoid `any`, use `unknown` with type guards
5. **Test builds locally** - Run `npm run build` before pushing
6. **Keep dependencies updated** - But test thoroughly before upgrading

---

## Next Steps After Deployment

1. ✅ Set environment variables in Vercel dashboard
2. ✅ Run database migrations: `npx prisma migrate deploy`
3. ✅ Test all API endpoints
4. ✅ Monitor build logs for any new issues
5. ✅ Check application performance

