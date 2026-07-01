# Vercel Deployment Guide

## Steps to Deploy to Vercel

### 1. **Environment Variables Setup**
On your Vercel Dashboard for the fitness project:

1. Go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `file:./prisma/dev.db` (for SQLite) or your production database URL
   - **Environments**: Check all environments (Development, Preview, Production)

### 2. **Custom Domain Configuration**
1. Go to **Settings** → **Domains**
2. Add custom domain: `fitness-rafe.vercel.app`
   - Note: This is a Vercel subdomain, so no additional DNS configuration needed
3. Set it as the production domain

### 3. **Deploy**
1. Commit and push your changes to `main` branch (already done ✓)
2. Vercel will automatically trigger a new deployment
3. Monitor the deployment in the **Deployments** tab

## What Was Fixed

✅ **Updated build script** - Now runs `prisma generate` before Next.js build
✅ **Added vercel.json** - Explicit Vercel build configuration
✅ **Updated next.config.js** - Added Vercel optimizations
✅ **Added .env.local** - Local development environment setup
✅ **Improved db.ts** - Better Prisma client initialization

## Important Notes

- **DATABASE_URL** must be set in Vercel environment variables for the app to work
- For production, you may want to use a proper database service (PostgreSQL via Vercel Postgres, Supabase, etc.) instead of SQLite
- The `.env.local` file is only for local development (git-ignored)
- If you use SQLite in production, the database file will be recreated on each deployment (not persistent)

## If Build Still Fails

1. Check the build logs in Vercel dashboard
2. Ensure DATABASE_URL is properly set
3. Run `npm run build` locally to test: `npm run build`
4. If local build works, the Vercel build should too

## Using Prisma Data Proxy (recommended)

If you're deploying to serverless platforms like Vercel and Prisma's query engine
is failing to load, Prisma Data Proxy removes the need for a local engine.

1. Enable Data Proxy in your Prisma Cloud/Console and create a Data Proxy service.
2. Copy the Data Proxy URL (a special `prisma://...` URL).
3. In Vercel Settings → Environment Variables, add:
   - `PRISMA_DATA_PROXY_URL` = `<your-data-proxy-url>`
   - Keep `DATABASE_URL` pointing to your Postgres database (used for migrations locally)
4. Redeploy your project on Vercel.

Notes:
- Prisma Data Proxy is the most reliable option for serverless deployments.
- When using Data Proxy you do not need the native query engine binaries in the bundle.
- Data Proxy may have additional costs; check Prisma pricing.
