# PropPost

PropPost is a Supabase-backed real estate marketing workspace for South African agencies and agents. The app supports role-based onboarding, property management, lead tracking, dashboards, scheduled content, and AI-assisted social post generation.

## Architecture

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Auth and database: Supabase Auth plus Supabase Postgres
- Runtime server: a small Express wrapper for local Vite middleware, production static serving, uploads, health checks, and `/api/generate-post`
- AI generation: Gemini via `GEMINI_API_KEY`

Supabase is the only application database. There is no local SQLite/JWT API backend.

## Prerequisites

- Node.js 22 or newer
- A Supabase project
- A Gemini API key if you want AI post generation

## Environment

Create `.env` from `.env.example`:

```bash
GEMINI_API_KEY=replace-with-your-gemini-api-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=replace-with-your-supabase-anon-key
```

`GEMINI_API_KEY` is read by the Express server. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the browser by Vite.

## Supabase Setup

Run `supabase_schema.sql` in the Supabase SQL editor for the target project. The frontend expects these core tables to exist:

- `agencies`
- `agents`
- `properties`
- `leads`
- `schedules`
- `amenities`
- `branding`

Review the row-level security policies before production. The current schema is permissive for development and troubleshooting.

## Local Development

```bash
npm install
npm run dev
```

The development server listens on `http://localhost:3000` by default.

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```bash
npm.cmd run dev
```

## Build and Verification

```bash
npm run lint
npm run build
npm run test:smoke
```

`npm run lint` runs `tsc --noEmit`. `npm run build` builds the Vite client and bundles `server.ts` to `dist/server.js`.

`npm run test:smoke` runs Playwright smoke tests. By default it verifies the public signup/login screens and `/api/generate-post` JSON contract. To run the authenticated dashboard flows, provide a real test account:

```bash
E2E_EMAIL=agent@example.com
E2E_PASSWORD=your-test-password
E2E_ROLE=agent
```

Optional for agency login smoke tests:

```bash
E2E_AGENCY_DOMAIN=your-agency-domain
```

Authenticated smoke coverage includes login routing, dashboard rendering, adding a property, and the post builder generation/scheduling flow. The post-builder test mocks the AI response in-browser so it does not spend Gemini quota.

## Production

```bash
npm run build
npm start
```

The production server serves the built app from `dist` and keeps `/api/generate-post` available.

Before production, run `supabase_schema.sql` against the target Supabase project and verify that policies match your business rules. The schema now scopes agency, agent, property, lead, schedule, branding, and invite access by authenticated user ownership or agency membership.
