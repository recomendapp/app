import { readFileSync } from 'node:fs';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client, Pool } from 'pg';
import * as schema from '@libs/db/schemas';
import { SNAPSHOT_NAME, TEST_DB_STATE_FILE } from './constants';

export type Schema = typeof schema;

function readDatabaseUrl(): string {
  try {
    const raw = readFileSync(TEST_DB_STATE_FILE, 'utf-8');
    return JSON.parse(raw).databaseUrl;
  } catch {
    throw new Error(
      'No test database connection found. Integration specs (*.integration.spec.ts) must run ' +
        "through the `test-integration` Nx target (e.g. `nx test-integration api`) — it's the " +
        "one that sets Jest's globalSetup to boot the shared Postgres testcontainer.",
    );
  }
}

/**
 * A connection to the shared ephemeral test Postgres container, scoped to
 * a single spec file. The container itself is started once for the whole
 * test run by Jest's globalSetup (see global-setup.ts); this just connects
 * to it using the connection string it left behind.
 *
 * Usage:
 * ```ts
 * let testDb: TestDatabase;
 * beforeAll(async () => { testDb = await TestDatabase.create(); });
 * afterEach(async () => { await testDb.reset(); });
 * afterAll(async () => { await testDb.close(); });
 *
 * it('likes a review', async () => {
 *   const service = new ReviewMovieLikesService(testDb.db, createFakeNotifyClient());
 *   // ...
 * });
 * ```
 *
 * `reset()` drops and recreates the database from the post-migration/seed
 * template, so it always reconnects with a fresh pool afterwards — read
 * `testDb.db` fresh (e.g. build the service under test in `beforeEach`)
 * rather than capturing it once, since the reference changes on reset.
 */
export class TestDatabase {
  db!: NodePgDatabase<Schema>;
  private pool!: Pool;
  private readonly databaseUrl: string;
  private readonly databaseName: string;
  // Same server/credentials, but pointed at the "postgres" system database
  // — you can't DROP/CREATE the database you're currently connected to.
  private readonly adminUrl: string;

  private constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
    this.databaseName = new URL(databaseUrl).pathname.slice(1);

    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = '/postgres';
    this.adminUrl = adminUrl.toString();
  }

  static async create(): Promise<TestDatabase> {
    const instance = new TestDatabase(readDatabaseUrl());
    instance.connect();
    return instance;
  }

  private connect(): void {
    this.pool = new Pool({ connectionString: this.databaseUrl });
    this.db = drizzle(this.pool, { schema });
  }

  async reset(): Promise<void> {
    await this.pool.end().catch(() => undefined);

    const admin = new Client({ connectionString: this.adminUrl });
    await admin.connect();
    try {
      await admin.query(`DROP DATABASE "${this.databaseName}" WITH (FORCE)`);
      await admin.query(`CREATE DATABASE "${this.databaseName}" WITH TEMPLATE "${SNAPSHOT_NAME}"`);
    } finally {
      await admin.end();
    }

    this.connect();
  }

  async close(): Promise<void> {
    await this.pool.end().catch(() => undefined);
  }
}
