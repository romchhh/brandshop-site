# BrandShop

Next.js (App Router) + React + TypeScript storefront for BrandShop.

## Run locally

```bash
npm install
npm run sync   # pull products from feed.xml
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Catalog sync (every 3 hours)

Source: `https://brandshop.in.ua/feed.xml`

| Trigger | How |
| --- | --- |
| Build | `prebuild` → `npm run sync` |
| Manual | `npm run sync` or `GET /api/cron/sync` |
| Vercel | Cron in `vercel.json` → `/api/cron/sync` every 3h |
| Node server | `instrumentation.ts` interval every 3h |
| Runtime | `/api/catalog` serves memory/disk; refreshes in background when stale |

Set `CRON_SECRET` in production (see `.env.example`). Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.

Synced snapshot: `data/catalog.json`.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

Legacy prototype: `legacy/BrandShop.html`.
