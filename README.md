# AKS-Store - E-commerce Platform

A modern e-commerce platform built with Next.js 15, Prisma, PostgreSQL, and TypeScript.

## Features

- 🛍️ Product catalog with categories
- 🛒 Shopping cart functionality
- 💳 Stripe payment integration
- 👤 User authentication and profiles
- 🚴 Rider delivery management
- 💬 Real-time chat system
- 🎫 Coupon code system
- 📊 Admin dashboard
- 🖼️ Image optimization with Cloudinary

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd my-next-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret for session management
- `ADMIN_KEY_HASH` - Bcrypt hash of your admin key
- Other service keys (Cloudinary, Stripe, etc.)

4. Set up the database:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment on Vercel

### Step 1: Prepare Your Repository

1. Ensure all changes are committed:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
```

2. Push to GitHub:
```bash
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`:
     - `DATABASE_URL`
     - `SESSION_SECRET`
     - `ADMIN_KEY_HASH`
     - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
     - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
     - `NODE_ENV=production`

5. Vercel will automatically:
   - Run `npm install`
   - Run `prisma generate` (via postinstall script)
   - Run `next build`
   - Deploy your application

### Step 3: Run Database Migrations

After deployment, run migrations on your production database:

```bash
# Using Vercel CLI
npx vercel env pull .env.production
npx prisma migrate deploy
```

Or use a database migration service or run directly:
```bash
DATABASE_URL="your_production_db_url" npx prisma migrate deploy
```

## Git Commands for Updates

### Initial Setup
```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin <your-github-repo-url>

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Push to main branch
git push -u origin main
```

### Regular Updates
```bash
# Check status
git status

# Add specific files or all changes
git add .
# OR
git add src/ prisma/ package.json

# Commit with descriptive message
git commit -m "Fix: Improve product loading performance and database queries"

# Push to GitHub
git push origin main
```

### Update Workflow
```bash
# 1. Make your changes
# 2. Stage changes
git add .

# 3. Commit
git commit -m "Description of changes"

# 4. Push to trigger Vercel deployment
git push origin main
```

Vercel will automatically detect the push and redeploy your application.

## Performance Optimizations

- ✅ API route caching (60s cache with stale-while-revalidate)
- ✅ Database query optimization with indexes
- ✅ Image optimization with Next.js Image component
- ✅ SWR for client-side data fetching with deduplication
- ✅ Reduced query logging in production
- ✅ Optimized bundle size with package imports

## Database Schema

The application uses Prisma with PostgreSQL. Key models:
- `User` - Customer, Admin, and Rider roles
- `Product` - Product catalog with images
- `Category` - Product categories
- `Cart` & `CartItem` - Shopping cart
- `Order` & `OrderItem` - Order management
- `Payment` - Payment processing
- `Coupon` - Discount codes
- `Conversation` & `Message` - Chat system

## Troubleshooting

### Products Not Loading

1. Check database connection:
   - Verify `DATABASE_URL` is correct
   - Ensure database is accessible
   - Check Prisma Client is generated: `npx prisma generate`

2. Check API route:
   - Visit `/api/products` directly
   - Check browser console for errors
   - Check Vercel function logs

3. Database issues:
   - Run migrations: `npx prisma migrate deploy`
   - Verify products exist in database
   - Check `deletedAt` is null for active products

### Build Errors on Vercel

1. Ensure `postinstall` script runs Prisma generate
2. Check all environment variables are set
3. Verify Node.js version (18+) in Vercel settings
4. Check build logs in Vercel dashboard

## License

Private - All rights reserved
