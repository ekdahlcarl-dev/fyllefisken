# FylleFisken

FylleFisken is a Next.js application for fishing competitions, standings and member features.

## Requirements

- Node.js 24.x
- npm

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

`npm run check` runs the complete validation chain.

## Environments

The application distinguishes between local, preview and production environments using Vercel's `VERCEL_ENV`. `NEXT_PUBLIC_APP_URL` is optional and may be set to a canonical URL. On Vercel, the app falls back to `VERCEL_URL` when no explicit app URL is configured.

Secrets belong in local `.env.local` files or Vercel Environment Variables. `.env`, `.env.local`, `.env.*.local` and `.vercel` are ignored by Git and must not be committed.

## Health check

`GET /api/health` returns a small JSON payload containing service status and the detected runtime environment.

## Vercel deployment

1. Import `ekdahlcarl-dev/fyllefisken` into the Vercel team.
2. Keep the framework preset as Next.js and the repository root as the project root.
3. Use Node.js 24.x.
4. Configure environment variables separately for Development, Preview and Production if required.
5. Keep Git integration enabled so every pull request receives a Preview Deployment and `main` deploys to Production.
6. Verify `/api/health` after each environment is deployed.

The repository is connected to the Vercel project `fyllefisken` in the `Calle` team. Git pushes to feature branches create Preview Deployments, while `main` is the Production branch.

## Continuous integration

GitHub Actions validates pull requests and pushes to `main` with TypeScript checks, ESLint, Prettier and a production Next.js build.
