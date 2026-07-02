# Vercel Deployment Guide

## Prerequisites

- A PostgreSQL database (e.g., Vercel Postgres, Neon, Supabase)
- Your project pushed to a GitHub repository connected to Vercel

## Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable       | Value                                  | Environments           |
|----------------|----------------------------------------|------------------------|
| `DATABASE_URL` | Your PostgreSQL connection string       | Production, Preview    |
| `JWT_SECRET`   | A strong random string (32+ chars)     | Production, Preview    |

> **Note:** `DATABASE_URL` must be a full PostgreSQL connection string like:  
> `postgresql://user:password@host:5432/dbname?sslmode=require`

## How Deployment Works

1. **`postinstall`** — Runs `prisma generate` to build the Prisma Client
2. **`build`** — Runs `prisma generate` + `prisma db push` (syncs schema to Postgres) + `next build`
3. Vercel auto-detects Next.js and deploys with optimized serverless functions

## After First Deploy

Run the seed script to populate the default habits table. You can do this locally:

```bash
DATABASE_URL="your-production-postgres-url" npx prisma db seed
```

Or add the seed to the build script if you want it automatic.

## Troubleshooting

### Prisma Engine Not Found
- Ensure `prisma/schema.prisma` has `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
- Ensure `next.config.js` has `serverComponentsExternalPackages: ['@prisma/client', 'prisma']` at the **top level** (not inside `experimental`)
- Do NOT use a custom `vercel.json` with `builds` — let Vercel auto-detect Next.js

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Ensure your database allows connections from Vercel's IP ranges
- Add `?sslmode=require` to the connection string if needed
