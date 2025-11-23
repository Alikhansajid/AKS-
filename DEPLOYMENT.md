# Deployment Guide for Vercel

## Quick Start

### 1. Initial Setup

```bash
# Make sure you're in the project directory
cd my-next-app

# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Fix: Optimize product loading and database queries for Vercel"

# Push to GitHub (this will trigger Vercel deployment)
git push origin main
```

### 2. Vercel Configuration

#### Environment Variables Required in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
SESSION_SECRET=your_random_secret_string_here
ADMIN_KEY_HASH=$2b$10$your_bcrypt_hash_here
NODE_ENV=production
```

**Optional (if using these services):**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### 3. Database Setup

#### On Vercel (Production):

After your first deployment, run database migrations:

```bash
# Option 1: Using Vercel CLI
npx vercel env pull .env.production
npx prisma migrate deploy

# Option 2: Direct connection
DATABASE_URL="your_production_db_url" npx prisma migrate deploy
```

### 4. Verify Deployment

1. Check Vercel deployment logs for any errors
2. Visit your deployed URL
3. Test the products page: `https://your-app.vercel.app`
4. Check API endpoint: `https://your-app.vercel.app/api/products`

## Common Issues & Solutions

### Issue: Products Not Loading

**Solution:**
1. Check Vercel function logs
2. Verify `DATABASE_URL` is correct
3. Ensure Prisma Client is generated (happens automatically via `postinstall`)
4. Run migrations: `npx prisma migrate deploy`

### Issue: Build Fails on Vercel

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify Node.js version (should be 18+)
4. Check that `package.json` has `postinstall` script

### Issue: Database Connection Errors

**Solution:**
1. Verify database is accessible from Vercel's IP ranges
2. Check connection string format
3. Ensure database allows external connections
4. For managed databases (like Vercel Postgres), use the connection string provided

## Git Commands Reference

### Daily Workflow

```bash
# 1. Check what changed
git status

# 2. Stage changes
git add .

# 3. Commit with message
git commit -m "Description of your changes"

# 4. Push to trigger deployment
git push origin main
```

### Working with Branches

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "Add new feature"

# Push branch
git push origin feature/your-feature-name

# Merge to main (via GitHub PR or locally)
git checkout main
git merge feature/your-feature-name
git push origin main
```

### Rollback Changes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a specific commit
git revert <commit-hash>
```

## Performance Monitoring

After deployment, monitor:
- Vercel Analytics dashboard
- Function execution times
- Database query performance
- API response times

## Security Checklist

- ✅ Environment variables are set in Vercel (not in code)
- ✅ Database connection uses SSL
- ✅ Session secret is strong and random
- ✅ Admin key is properly hashed
- ✅ API routes have proper error handling
- ✅ No sensitive data in logs

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for client errors
3. Test API endpoints directly
4. Verify database connectivity
5. Check Prisma migrations status

