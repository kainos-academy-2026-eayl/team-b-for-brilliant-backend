# team-b-for-brilliant-backend
Team B For Brilliant Backend

## Local Database and Prisma

Use Node.js 22.12 or newer within the Node.js 22 release line.

1. Run `npm install`.
2. Create `.env` using `.env.example` as a template. Keep `DATABASE_URL` in sync with the PostgreSQL credentials, database name and published port.
3. Start PostgreSQL with `docker compose up -d db`.
4. Run `npm run prisma:generate` to generate the type-safe database client.
5. Start the API with `npm run dev`.

The API runs on your machine, so `DATABASE_URL` uses `localhost`. If the API later runs in the same Compose network, use `db:5432` instead.

Prisma 7 uses `prisma.config.ts` for the CLI connection and `src/prismaClient.ts` for the shared application client. Import that client wherever database queries are needed:

```typescript
import prisma from './prismaClient';
```

Define models in `prisma/schema.prisma`, then run:

```sh
npm run prisma:migrate -- --name init
npm run prisma:generate
```

No models or migrations are included yet, so setup does not create or change tables. For an existing database, use `npx prisma db pull` to import its tables into the schema before generating the client; baseline it before adopting Prisma migrations.

Run `npm run prisma:studio` to browse the database. Commit the schema and migrations, but not `.env` or the generated client. `npm run build` regenerates the client automatically.
