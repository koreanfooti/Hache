# Hache

Hache is a team performance dashboard built with [Next.js](https://nextjs.org).
It connects to VALD tenants, groups, and athlete profiles so staff can choose a
team first, inspect the roster, and see player positions when those positions
are modeled in VALD groups/categories.

## Configuration

Create a local `.env.local` file with your VALD credentials:

```bash
VALD_CLIENT_ID=your-client-id
VALD_CLIENT_SECRET=your-client-secret
VALD_TENANT_ID=your-tenant-id
VALD_AUDIENCE=vald-api-external
VALD_TENANTS_BASE_URL=https://prd-use-api-externaltenants.valdperformance.com
VALD_PROFILES_BASE_URL=https://prd-use-api-externalprofile.valdperformance.com
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Production Checks

Run the full local gate before shipping:

```bash
npm run verify
```

The app exposes a lightweight health/readiness endpoint at
[`/api/health`](http://localhost:3000/api/health). It reports whether the app is
running and whether the required cleaned AMS data files are available under
`public/ams/data/clean`.

The cleaned AMS data directory is currently ignored by Git, so production
deployments need that data supplied by storage, a build artifact, or real API
connectors.
