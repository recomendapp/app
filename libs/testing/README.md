# @libs/testing

Shared test infrastructure for the monorepo. Currently covers integration
testing against a real ephemeral Postgres database; more helpers (HTTP,
fakes for other shared clients, etc.) should land here as they're needed by
other apps (`worker`, `notify`, ...).

## Why a real database instead of mocking Drizzle

A lot of this repo's business logic — counters especially — lives in
Postgres triggers, not application code (see `libs/db/drizzle/*_triggers.sql`).
Mocking Drizzle's fluent query builder can verify a service _calls_ the
right methods, but it can never verify a trigger actually fires. Integration
tests that run the real migrations against a real (disposable) Postgres are
the only way to catch that class of bug, so that's the default here.

Pure-logic unit tests (validation rules, DTO shaping, etc. with no DB or
queue dependency) still belong in a plain `*.spec.ts` file using regular
Jest — nothing here is required for those.

## How it works

- Jest's `globalSetup` (`global-setup.ts`) builds `apps/postgres/Dockerfile`
  (the same image `docker-compose.yaml` uses for local dev, with the
  `postgis`/`unaccent` extensions migrations need), starts ONE Postgres
  testcontainer for the whole run, runs `drizzle-kit migrate` and the
  repo's `db-seed` script against it, and snapshots the result.
- `globalSetup` and each spec file are separate Jest module instances with
  no shared JS memory (this is true even with a single worker — it's not a
  parallelism thing), so the connection string is handed off through a temp
  file instead. Each spec file's `TestDatabase.create()` reads it and opens
  its own connection to that same container.
- Between tests, `reset()` drops and recreates the database from the
  snapshotted template via plain SQL, which is much faster and more
  reliable than hand-written `TRUNCATE` statements.
- Every spec file targets the same physical database, so they run one at a
  time (`maxWorkers: 1` in `jest.integration.config.cts`) — otherwise one
  file's `reset()` could drop the database out from under another file's
  in-flight query.

## Writing an integration test

Name the file `*.integration.spec.ts` — that's what routes it to the
`test-integration` Nx target instead of the fast `test` target.

```ts
import { TestDatabase, createTestUser, createFakeNotifyClient } from '@libs/testing';
import { ReviewMovieLikesService } from './review-movie-likes.service';

describe('ReviewMovieLikesService', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  });

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('likes a review and notifies its author', async () => {
    const { user: author } = await createTestUser(testDb.db);
    // ...insert a movie/log/review fixture, then:

    const notify = createFakeNotifyClient();
    const service = new ReviewMovieLikesService(testDb.db, notify);

    // ...call service.like(...), assert the DB row + the trigger-maintained
    // count + that notify.emit was called with the right payload.
  });
});
```

Build the service under test fresh from `testDb.db` in each test (or in a
`beforeEach` after `TestDatabase.create()`/`reset()`) rather than capturing
it once — `reset()` reconnects with a new pool every time, since restoring
the snapshot forcibly drops the database out from under any open
connection.

## Fixtures

`createTestUser(db, overrides?)` inserts a `user` + `profile` row — nearly
every table eventually hangs off a user, so this is the one fixture worth
having up front. Add more under `src/lib/fixtures/` as new test suites need
them (movie/tv-series logs, reviews, comments, ...) rather than duplicating
raw inserts across spec files.

## Local development

Requires Docker running locally (same as `docker-compose up` for the rest
of the stack). Set `TESTCONTAINERS_REUSE_ENABLE=true` to keep the container
(already migrated, seeded, and snapshotted) alive between separate
`nx test-integration api` runs instead of rebuilding it every time — never
set this in CI.

## Running

```
nx test-integration api        # this project's integration suite
nx affected -t test-integration  # whatever integration suites changed touch
```

CI runs both `test` and `test-integration` as affected targets (see
`.github/workflows/ci.yml`).
