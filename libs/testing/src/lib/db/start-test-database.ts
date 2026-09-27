import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { GenericContainer } from 'testcontainers';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { POSTGRES_IMAGE_TAG } from './constants';

const workspaceRoot = join(__dirname, '../../../../..');

function runDbCommand(command: string, args: string[], databaseUrl: string): void {
  execFileSync(command, args, {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

export interface StartedTestDatabase {
  databaseUrl: string;
  stop(): Promise<void>;
}

/**
 * Boots ONE Postgres testcontainer for a whole integration run: migrated,
 * seeded, and snapshotted so TestDatabase#reset() can restore it quickly.
 */
export async function startTestDatabase(): Promise<StartedTestDatabase> {
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
  const reuse = process.env['TESTCONTAINERS_REUSE_ENABLE'] === 'true';
  if (reuse) {
    builder = builder.withReuse();
  }

  const container = await builder.start();
  const databaseUrl = container.getConnectionUri();

  runDbCommand(
    'bunx',
    ['drizzle-kit', 'migrate', '--config=libs/db/drizzle.config.ts'],
    databaseUrl,
  );
  runDbCommand('bun', ['--no-env-file', 'libs/db/scripts/seed.ts'], databaseUrl);

  // Snapshots the freshly migrated+seeded database as a template so
  // TestDatabase#reset() can restore to this exact state in a fraction of
  // the time a full re-migrate would take.
  await container.snapshot();

  return {
    databaseUrl,
    stop: async () => {
      if (!reuse) await container.stop();
    },
  };
}
