import { spawn } from 'node:child_process';
import { TEST_DATABASE_URL_ENV } from './constants';
import { startTestDatabase } from './start-test-database';

/**
 * Entry point of the `test-integration` targets:
 *   bun run-integration-tests.ts <bun test arguments>
 *
 * Starts the shared Postgres testcontainer once, runs `bun test` with its URL
 * in the environment, then stops it. Setup can't live in a `bun test --preload`
 * hook: under --isolate those hooks run once per spec file.
 */
async function main(): Promise<number> {
  const database = await startTestDatabase();
  try {
    const child = spawn('bun', ['test', ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: { ...process.env, [TEST_DATABASE_URL_ENV]: database.databaseUrl },
    });
    const forward = (signal: NodeJS.Signals) => child.kill(signal);
    process.on('SIGINT', forward);
    process.on('SIGTERM', forward);
    return await new Promise<number>((resolve) => child.on('exit', (code) => resolve(code ?? 1)));
  } finally {
    await database.stop();
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
