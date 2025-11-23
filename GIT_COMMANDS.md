# Git Commands for Code Updates

## Quick Reference

### Initial Setup (First Time)

```bash
# Navigate to project directory
cd D:\Nextjs\my-next-app

# Check current status
git status

# Add all files
git add .

# Commit changes
git commit -m "Fix: Optimize product loading, database queries, and Vercel deployment"

# Push to GitHub (this triggers Vercel deployment)
git push origin main
```

## Regular Update Workflow

### Step 1: Check What Changed
```bash
git status
```

### Step 2: Stage Your Changes
```bash
# Add all changes
git add .

# OR add specific files
git add src/app/api/products/route.ts
git add prisma/schema.prisma
git add package.json
```

### Step 3: Commit Changes
```bash
# With descriptive message
git commit -m "Fix: Improve product loading performance"

# OR more detailed
git commit -m "Fix: 
- Optimize database queries with indexes
- Add caching to products API
- Fix Prisma client import for Vercel
- Improve page load speed"
```

### Step 4: Push to GitHub
```bash
# Push to main branch (triggers Vercel deployment)
git push origin main

# OR push to feature branch
git push origin feature/your-branch-name
```

## Common Scenarios

### Scenario 1: Making Code Changes

```bash
# 1. Make your code changes
# 2. Check what changed
git status

# 3. Add changes
git add .

# 4. Commit
git commit -m "Description of your changes"

# 5. Push (triggers Vercel auto-deploy)
git push origin main
```

### Scenario 2: Updating Database Schema

```bash
# 1. Update prisma/schema.prisma
# 2. Generate Prisma client
npx prisma generate

# 3. Create migration
npx prisma migrate dev --name your_migration_name

# 4. Commit changes
git add .
git commit -m "Update: Database schema changes"
git push origin main

# 5. After Vercel deploys, run migration on production
npx prisma migrate deploy
```

### Scenario 3: Adding New Features

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... your code changes ...

# 3. Commit
git add .
git commit -m "Add: New feature description"

# 4. Push branch
git push origin feature/new-feature

# 5. Merge to main (via GitHub PR or locally)
git checkout main
git merge feature/new-feature
git push origin main
```

### Scenario 4: Fixing Bugs

```bash
# 1. Make bug fixes
# 2. Test locally
npm run dev

# 3. Commit fix
git add .
git commit -m "Fix: Description of bug fix"

# 4. Push
git push origin main
```

## Useful Git Commands

### View Changes
```bash
# See what files changed
git status

# See detailed changes
git diff

# See commit history
git log --oneline
```

### Undo Changes

```bash
# Undo uncommitted changes to a file
git checkout -- filename

# Undo all uncommitted changes
git reset --hard HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Branch Management

```bash
# List branches
git branch

# Create new branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# Delete branch
git branch -d branch-name
```

## Before Pushing Checklist

- [ ] Code works locally (`npm run dev`)
- [ ] No console errors
- [ ] Database migrations run successfully
- [ ] Environment variables are set in Vercel
- [ ] Commit message is descriptive
- [ ] All changes are staged (`git add .`)

## After Pushing

1. **Check Vercel Dashboard:**
   - Go to your Vercel project
   - Monitor deployment logs
   - Verify deployment succeeds

2. **Test Production:**
   - Visit your deployed URL
   - Test key features
   - Check for errors

3. **If Deployment Fails:**
   - Check Vercel build logs
   - Verify environment variables
   - Check database connection
   - Run `npx prisma generate` locally to verify

## Example: Complete Update Session

```bash
# 1. Navigate to project
cd D:\Nextjs\my-next-app

# 2. Check status
git status

# 3. Pull latest changes (if working with team)
git pull origin main

# 4. Make your changes
# ... edit files ...

# 5. Test locally
npm run dev

# 6. Stage changes
git add .

# 7. Commit
git commit -m "Fix: Product loading performance improvements"

# 8. Push to GitHub
git push origin main

# 9. Monitor Vercel deployment
# (Check Vercel dashboard)

# 10. Test production site
# (Visit your deployed URL)
```

## Troubleshooting

### Error: "Your branch is ahead of origin"
```bash
# Just push your changes
git push origin main
```

### Error: "Please commit your changes"
```bash
# Commit first
git add .
git commit -m "Your commit message"
git push origin main
```

### Error: "Merge conflict"
```bash
# Pull latest changes
git pull origin main

# Resolve conflicts, then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

## Quick Commands Reference

```bash
# Status
git status

# Add all
git add .

# Commit
git commit -m "Message"

# Push
git push origin main

# Pull
git pull origin main

# Log
git log --oneline

# Diff
git diff
```

