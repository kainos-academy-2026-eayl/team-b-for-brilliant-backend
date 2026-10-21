# team-b-for-brilliant-backend
Team B For Brilliant Backend

## Local database and Prisma

Prisma lets the backend query Postgres through a typed TypeScript client.
The project uses Prisma 7. The schema currently has no models, and there
are no migrations or application tables. New versioned SQL migrations will
live in `prisma/migrations`.
The CLI reads `DATABASE_URL` from `prisma.config.ts`, not the schema.
The shared client uses `@prisma/adapter-pg` to connect to Postgres.

1. Copy `.env.example` to `.env` if you do not already have one. If you do,
   add any missing variables without overwriting your existing values.
2. Start Docker Desktop, then run `docker compose up -d`.
3. Run `npm ci`, then `npm run prisma:generate`.
4. Check your schema with `npm run prisma:validate`. Create your first
   migration after adding models, as described below.

The default local connection is
`postgresql://dev:dev@localhost:5432/app_dev`. If you change the Postgres
credentials, database name, or host port, update `DATABASE_URL` to match.
Never commit `.env` or use these development credentials in production.

Define tables as models in `prisma/schema.prisma`. After changing models, run:

```sh
npm run prisma:migrate -- --name describe_your_change
```

This creates a versioned SQL migration, applies it to your local database,
and then the npm script generates a client matching your models (Prisma 7
does not generate it automatically during migrations). Commit the schema and migrations
with the feature. Do not reset an existing database just to set up Prisma.

Import the shared client from `src/prismaClient.ts` in your services:

```ts
import { prisma } from '../prismaClient';
```

The module loads `.env` and reports a missing `DATABASE_URL` explicitly.
Use one shared client rather than creating a new client for each request.
The existing endpoints are unchanged and do not use the database yet.

- `npm run prisma:generate` regenerates `src/generated/prisma`.
- `npm run prisma:validate` checks the schema without changing the database.
- `npm run prisma:migrate -- --name <change-name>` creates and applies a
  development migration after a schema change.
- `npm run prisma:studio` opens a database browser once models exist.
- `npm run typecheck` (also used by the build) generates the client first,
  so CI does not depend on an existing generated client or a running database.

## Backend CI

The `Backend CI` workflow runs on pull requests targeting `main` or `master` (including new commits and reopened PRs), and on pushes to either branch, including merges. It installs dependencies using `npm ci`, then runs:

```sh
npm run build
npm run lint
npm test
```

Build includes TypeScript checks. Lint uses Biome to check formatting, imports and recommended lint rules, and fails on warnings as well as errors. Tests use Node's test runner with `tsx` and Supertest to check the health endpoint, bookings endpoint and unknown routes. These tests do not need a database or secrets.

## Linting and Push Checks

Run `npm install` (or `npm ci`) after cloning. The `prepare` script installs Husky's Git hooks automatically.

- `npm run lint` reports issues without modifying files.
- `npm run lint:fix` applies formatting and safe fixes. Issues requiring manual changes still cause failure.
- The Husky `pre-push` hook runs `npm run lint` and blocks the push if checks fail. Fix the issues and commit the fixes before retrying.

Rules and formatting settings live in `biome.json`. Generated Prisma code, the lockfile and Git-ignored files are excluded. The frontend repository should use the same Biome version, configuration and npm scripts for consistency.

Git hooks can be bypassed locally, so keep the required CI status check enabled as described below. CI runs the same read-only lint command.

### Required Merge Protection

The workflow alone cannot block merging. A repository administrator must configure branch protection on GitHub:

1. Push the workflow and let it run on a pull request so its check becomes selectable.
2. Open **Settings > Branches > Add branch protection rule** for `main`. Repeat for `master` if that branch is used.
3. Enable **Require a pull request before merging**.
4. Enable **Require status checks to pass before merging** and select **Build, Lint and Test** from the **Backend CI** workflow.
5. Enable **Require branches to be up to date before merging**.
6. Enable **Do not allow bypassing the above settings** so administrators cannot bypass failed checks, then save the rule.

Until this repository setting is enabled, failed CI checks will not prevent merges. The workflow fails if installation, build, lint or tests fail; it does not suppress failures or allow empty test runs.
