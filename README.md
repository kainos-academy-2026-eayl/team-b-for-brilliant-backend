# team-b-for-brilliant-backend
Team B For Brilliant Backend

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
