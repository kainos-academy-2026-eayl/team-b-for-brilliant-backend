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

The categories migration has been restored to its original applied contents,
including creation of the original account tables. Do not remove statements from
already-applied migrations: it breaks both checksum validation and fresh setup.
The `20261027142300_unify_users_and_baskets` migration preserves account IDs,
password hashes, admin roles, baskets and order links while matching the current
schema. It rejects conflicting customer/admin IDs or email addresses instead of
merging accounts silently. Removed verification/MFA fields and admin usernames
are not retained in the new schema.

Import the shared client from `src/prismaClient.ts` in your repositories:

```ts
import { prisma } from '../prismaClient';
```

The module loads `.env` and reports a missing `DATABASE_URL` explicitly.
Use one shared client rather than creating a new client for each request.
The products endpoint uses the database. Health and bookings do not.
The products repository loads the shared client when queried.

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
Database errors propagate to Express rather than being converted into empty
successful responses.

### Fetch products and images

To populate the local database with the seed fixtures,
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

`GET /products` returns `{ "products": [...] }`. Each product includes its
`productImages` array, which is empty when the product has no images.
Each image includes `imageID`, `productID`, `imageUrl`, and its integer
`imageOrder`. Both the catalogue and single-product endpoints preserve the
stored order value so clients can sort images and select order 0 as the main image.
An empty database returns `{ "products": [] }`.

#### Search products

`GET /products?search=mug` searches product names using case-insensitive partial
matching (for example, matching "Travel Mug"). `q` is accepted as an alias for
the frontend's existing search form: `GET /products?q=mug`.
Supply only one of `search` or `q`. Search text is trimmed; empty, whitespace-only,
repeated, and structured values return HTTP 400 with an `error` message.
Omitting both parameters preserves the full catalogue response.

`GET /products/search/:name` remains supported with the same matching and
validation behavior. Both search endpoints return HTTP 200 with
`{ "products": [] }` when nothing matches (the legacy search endpoint no longer
returns HTTP 404 for an empty result). Database failures propagate as server errors.
The response retains product images, categories, and departments.
Search does not add category filtering; the backend currently ignores `category`.

```sh
curl 'http://localhost:3000/products?search=mug'
```

Route regression tests run with `npm test` without a database. To verify actual
PostgreSQL partial and case-insensitive matching, point `DATABASE_URL` at a
migrated, disposable test database and run:

```sh
RUN_DATABASE_TESTS=true node --import tsx --test tests/productSearchDatabase.test.ts
```

This opt-in test creates uniquely identified products and deletes those records
afterward. It is skipped in ordinary test runs. Never run it against production.

`GET /products/:productID` queries one product by ID, including its images,
and returns `{ "product": {...} }`. An unknown ID returns `404` with
`{ "error": "Product not found" }`. Database failures propagate as server errors.

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

### Registration

`POST /api/v1/auth/register` accepts an email address and a password of 8 to
1024 characters. Email addresses are trimmed and lowercased before storage.
Passwords are hashed before the account is created. Registration does not send
email or require an email-verification token.

New and already-registered addresses both receive HTTP 202 with
`{ "message": "Registration request processed" }` to avoid revealing whether an
account exists. Invalid input returns HTTP 400; registration failures return
HTTP 500. The former verification and resend-verification endpoints are removed.

### Credential verification

`POST /auth/unique-email` accepts `{ "email": "user@example.com" }` and returns
HTTP 200 with `{ "unique": true }` or `{ "unique": false }`. Clients must read
the boolean response, not infer uniqueness from the HTTP status.

`POST /auth/verify` accepts an email address and password. Valid credentials return
HTTP 200 with `{ "customerId": "<userID>", "accessToken": "<token>" }`;
no MFA flag is queried or returned. The access token uses the existing in-memory
session store, expires after one hour, and is sent as `Authorization: Bearer
<token>` for authenticated account requests. Tokens are local to the backend
process and are invalidated by a restart.
The `customerId` response key is retained for compatibility with the frontend,
while the account is stored in the `User` table. Incorrect passwords return
HTTP 401, unknown accounts return HTTP 404, and invalid input returns HTTP 400.

### Optional account details

`PUT /account/details` requires a valid bearer token and updates only its owner's
existing `User` record. It accepts `firstname`, `surname`, `addressLine1`,
`addressLine2` and `postcode`; all fields are optional. Values are trimmed, and
empty or omitted fields are stored as null. Names are limited to 100 characters,
address lines to 255, and postcodes to 20. This endpoint replaces these five
profile fields and does not change email, credentials, roles or security settings.

Success returns HTTP 204. Invalid input returns 400, unauthenticated requests
return 401, and a missing customer returns 404. No Prisma schema change or
database migration is required.

## Backend CI

The `Backend CI` workflow runs on pull requests targeting `main` or `master` (including new commits and reopened PRs), and on pushes to either branch, including merges. It installs dependencies using `npm ci`, then runs:

```sh
npm run build
npm run lint
```

Build includes TypeScript checks. Lint uses Biome to check formatting, imports and recommended lint rules, and fails on warnings as well as errors.

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
4. Enable **Require status checks to pass before merging** and select **Build and Lint** from the **Backend CI** workflow.
5. Enable **Require branches to be up to date before merging**.
6. Enable **Do not allow bypassing the above settings** so administrators cannot bypass failed checks, then save the rule.

Until this repository setting is enabled, failed CI checks will not prevent merges. The workflow fails if installation, build or lint fails; it does not suppress failures.
