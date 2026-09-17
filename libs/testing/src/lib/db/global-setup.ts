import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GenericContainer } from 'testcontainers';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { POSTGRES_IMAGE_TAG, TEST_DB_STATE_FILE } from './constants';

function runDbCommand(args: string[], workspaceRoot: string, databaseUrl: string): void {
  execFileSync('npx', args, {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

/**
 * Jest `globalSetup` for the `test-integration` project: boots ONE Postgres
 * testcontainer for the whole run, migrated + seeded + snapshotted, and
 * hands its connection string to every spec file via TEST_DB_STATE_FILE
 * (see TestDatabase in test-database.ts). Runs once, in Jest's main
 * process — never assume anything in here shares JS memory with a spec
 * file, which runs in its own isolated module registry.
 */
export default async function globalSetup(): Promise<void> {
  const workspaceRoot = process.cwd();

  // Build the exact same image docker-compose.yaml uses for local dev
  // (apps/postgres/Dockerfile adds the postgis/unaccent extensions the
  // migrations need on top of the official postgres image) so tests run
  // against the same extensions as dev/prod instead of a plain image.
  //
  // Context is scoped to apps/postgres/ itself, not the workspace root:
  // the Dockerfile has no COPY/ADD so it never reads repo files, but
  // testcontainers-node tars the context client-side before sending it to
  // the daemon (unlike the Docker CLI's BuildKit sync) — pointed at the
  // repo root that means tarring node_modules and everything else, which
  // hangs for minutes instead of seconds.
  await GenericContainer.fromDockerfile(join(workspaceRoot, 'apps/postgres'), 'Dockerfile').build(
    POSTGRES_IMAGE_TAG,
    { deleteOnExit: false },
  );

  let builder = new PostgreSqlContainer(POSTGRES_IMAGE_TAG)
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test');

  // Opt-in local dev speedup: keeps the same container (already migrated +
  // seeded + snapshotted) alive across separate `nx test-integration` runs
  // instead of rebuilding it from scratch every time. Never enable in CI.
  if (process.env['TESTCONTAINERS_REUSE_ENABLE'] === 'true') {
    builder = builder.withReuse();
  }

  const container = await builder.start();
  const databaseUrl = container.getConnectionUri();

  runDbCommand(
    ['drizzle-kit', 'migrate', '--config=libs/db/drizzle.config.ts'],
    workspaceRoot,
    databaseUrl,
  );
  runDbCommand(
    ['tsx', '--tsconfig', 'tsconfig.base.json', 'libs/db/scripts/seed.ts'],
    workspaceRoot,
    databaseUrl,
  );

  // Snapshots the freshly migrated+seeded database as a template so
  // TestDatabase#reset() can restore to this exact state in a fraction of
  // the time a full re-migrate would take.
  await container.snapshot();

  writeFileSync(TEST_DB_STATE_FILE, JSON.stringify({ databaseUrl }), 'utf-8');

  // No container.stop() here: this process (and Jest's globalTeardown,
  // which runs as a separate module instance with no reference to
  // `container`) can't reliably do it either way. Ryuk — the reaper
  // sidecar testcontainers starts automatically — kills every container
  // it started the moment this process tree exits, which is the standard
  // testcontainers cleanup story for exactly this situation.
}
