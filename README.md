# team-b-for-brilliant-backend
Team B For Brilliant Backend

## Local database and Prisma

Prisma lets the backend query Postgres through a typed TypeScript client.
The project uses Prisma 7. The schema defines products, their images and price history.
Versioned SQL migrations live in `prisma/migrations`.
The CLI reads `DATABASE_URL` from `prisma.config.ts`, not the schema.
The shared client uses `@prisma/adapter-pg` to connect to Postgres.

1. Copy `.env.example` to `.env` if you do not already have one. If you do,
   add any missing variables without overwriting your existing values.
2. Start Docker Desktop, then run `docker compose up -d`.
3. Run `npm ci`, then `npm run prisma:generate`.
4. Check your schema with `npm run prisma:validate`, then run
   `npm run prisma:migrate` to apply existing migrations locally.

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

Import the shared client from `src/prismaClient.ts` in your repositories:

```ts
import { prisma } from '../prismaClient';
```

The module loads `.env` and reports a missing `DATABASE_URL` explicitly.
Use one shared client rather than creating a new client for each request.
The products endpoint uses the database. Health and bookings do not.
The products repository loads the shared client when queried, so tests can
inject a fetch function without database credentials or a running database.

### Source structure

The products flow is controller -> service -> repository, with a mapper
converting database records into response DTOs:

- `src/controllers/products.ts` handles HTTP requests and responses.
- `src/services/products.ts` coordinates fetching and maps results.
- `src/repositories/products.ts` owns Prisma queries and includes product images.
- `src/dtos/product.ts` defines the public response shapes, independently of Prisma.
- `src/mappers/product.ts` maps records explicitly and converts dates to ISO strings,
  preserving the existing JSON response.
- `src/schemas/product.ts` defines new-product input validation and its inferred type.
- `tests/` contains endpoint and service/mapper tests; input-schema tests
  are also run from `src/productSchema.test.ts`.

Services can receive a repository function in tests; the app can receive a
service function for endpoint tests. Database errors propagate to Express
rather than being converted into empty successful responses.

### Fetch products and images

To populate the local database with the fixtures from `tests/product.test.ts`,
apply the migrations, then run:

```sh
npm run prisma:seed
```

`prisma/seed.ts` creates or updates `product-1` (with `image-1`) and
`product-2` (without a seeded image). It uses a transaction and fixed IDs,
so repeat runs do not create duplicates. Existing values for these IDs
are overwritten; unrelated records and images are not deleted.
It also upserts three price records per seeded product with fixed IDs and
timestamps (October 1, 2 and 3, 2026), so rerunning it does not duplicate prices.
The seeded image URL `/images/product-1.svg` points to an original sample
illustration stored in `public/images/product-1.svg`.
Prisma 7 runs seeding explicitly, not automatically after migration.
The unit tests use injected fixtures and do not require this seed or a database.

`GET /products` returns `{ "products": [...] }`. Each product includes its
`productImages` array, which is empty when the product has no images.
An empty database returns `{ "products": [] }`.

```sh
curl http://localhost:3000/products
```

### Product prices

- `GET /products/:productID/prices` returns `{ "prices": [...] }`, newest first.
- `GET /products/:productID/prices/current` returns `{ "price": {...} }`.

Current means the record with the latest `createdAt` timestamp, not the highest
price. Equal timestamps are resolved by descending `priceID` for deterministic
results. The current-price query fetches only one price record.
Each price contains `priceID`, `productID`, `price` (a decimal string such as
`"22.49"` to preserve monetary precision), and `createdAt` (an ISO timestamp).
Unknown products return HTTP 404. Existing products without prices return
`{ "prices": [] }` or `{ "price": null }`. Database errors return HTTP 500.
The existing `GET /products` response is unchanged.

After `npm run prisma:seed`, `product-1` has prices `"19.99"`, `"24.99"` and
`"22.49"` (current); `product-2` has `"9.99"`, `"12.99"` and `"11.49"` (current).
For example, with the backend on port 3001:

```sh
curl http://localhost:3001/products/product-1/prices
curl http://localhost:3001/products/product-1/prices/current
```

### Static product images

Express serves `public/images/` at `/images`. For example,
`http://localhost:3000/images/product-1.svg` returns the sample image.
The database stores the URL string, not the image contents.
Start the backend from the project root (`npm run dev` or `npm start`), and
include `public/images/` alongside `dist/` when deploying the built app.
Only place files intended for public access in this directory. Directory
listing is disabled, and missing images return HTTP 404.

This endpoint currently returns all products, including drafts, hidden products,
and soft-deleted products; it does not filter or paginate results. Database
failures are forwarded to Express's default error handler and return HTTP 500.

- `npm run prisma:generate` regenerates `src/generated/prisma`.
- `npm run prisma:validate` checks the schema without changing the database.
- `npm run prisma:migrate -- --name <change-name>` creates and applies a
  development migration after a schema change.
- `npm run prisma:studio` opens a database browser once models exist.
- `npm run typecheck` (also used by the build) generates the client first,
  so CI does not depend on an existing generated client or a running database.

### New-product input validation

`src/schemas/product.ts` exports `CreateProductSchema`, the inferred
`CreateProduct` type, and `validateCreateProduct(input: unknown)`.
The helper uses `safeParse` and returns either `{ success: true, data }` or
`{ success: false, errors: { formErrors, fieldErrors } }`. Check `success`
before using `data`. Form-level errors cover invalid top-level input such as
`null`; field-level errors identify invalid product properties.

Required fields are a trimmed, non-blank `name`, a non-negative integer
`quantity` (up to Postgres's 32-bit integer limit), and a finite, non-negative
`weight`. `description` is optional and can be null; `draft` and `visible`
are optional booleans. Omitted flags are left for Prisma's database defaults.
Unknown properties, including IDs, deletion timestamps and images, are stripped
from validated data. Always use the validated `data`, not the original input.
This is input validation only: it does not save products or add a POST endpoint.

## Customer credential verification

`POST /auth/verify` accepts JSON `{ "email": "...", "password": "..." }`.
The controller in `src/controllers/login.ts` calls the login service, which
looks up a customer through the Prisma repository. Email is trimmed and
lowercased; passwords are not trimmed. Customers must be stored with lowercase emails.
The `Customer` model stores `customerId`, unique `email`, and `passwordHash`.
Passwords are salted using Node's scrypt, not stored in plain text.

- Correct credentials: HTTP 200 with only `{ "customerId": "<id>" }`.
- Unknown email or incorrect password: HTTP 401.
- Invalid/missing request fields: HTTP 400.
- Database or password-record failures: logged server-side, HTTP 503 with a generic message.

This endpoint verifies credentials only. It does not create sessions, implement
logout, lockout, or rate limiting. The frontend owns its session and its
five-second backend-request timeout. Add rate limiting before exposing this endpoint publicly.

#### Connect to a specific Docker Postgres database

1. In the backend's uncommitted `.env`, set
   `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE`.
   URL-encode special characters in credentials. For a backend running on your
   Mac, `HOST` is `localhost` and `PORT` is the container's **published host port**,
   not necessarily 5432. For example, a `5433:5432` mapping uses port 5433.
   Check the mapping with `docker ps`.
2. With this repository's Compose database, set `POSTGRES_USER`,
   `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT` to match the URL.
   Start it with `docker compose up -d db` and check `docker compose ps`.
   These initialization variables do not change an already-initialized volume's
   credentials or create another database. Do not delete a volume to fix a mismatch.
3. If the backend also runs in Compose on the same network, use the database
   service name (`db` here) as `HOST` and its internal port 5432, not `localhost`.
4. Confirm this is the intended **development** database, then apply the committed
   migrations with `npx prisma migrate deploy` and run `npm run prisma:generate`.
   This creates the Customer table along with any pending product migrations;
   it does not insert a customer. Do not run development resets against an
   existing or shared database. Coordinate migrations for shared environments.
5. For local testing, add `SEED_CUSTOMER_EMAIL` and `SEED_CUSTOMER_PASSWORD`
   (at least eight characters) to the backend's `.env`, then run
   `npm run prisma:seed:customer`. No default credentials are committed.
   The command inserts a customer if the email is absent and never changes
   an existing customer's password. Remove the seed variables afterward.
6. Start/restart the backend with `npm run dev`. In the **frontend's** `.env`,
   set `CUSTOMER_ACCOUNT_SERVICE_URL` to the backend HTTP base URL
   (for example `http://localhost:3000`), not the PostgreSQL URL. Restart the
   frontend and test successful login, incorrect credentials, and backend downtime.

Existing databases need the Prisma Customer table and scrypt password format
described above. An existing unrelated account table or another hash format
requires an explicit schema/password migration; it will not be detected automatically.

## Backend CI

The `Backend CI` workflow runs on pull requests targeting `main` or `master` (including new commits and reopened PRs), and on pushes to either branch, including merges. It installs dependencies using `npm ci`, then runs:

```sh
npm run build
npm run lint
npm test
```

Build includes TypeScript checks. Lint uses Biome to check formatting, imports and recommended lint rules, and fails on warnings as well as errors. Tests use Node's test runner with `tsx` and Supertest to check health, bookings, products (with an injected fetch function), and unknown routes. These tests do not need a database or secrets.

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
