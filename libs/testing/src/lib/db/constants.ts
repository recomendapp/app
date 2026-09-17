import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Handoff point between Jest's globalSetup (which owns the container and
// runs once, in its own module instance) and each spec file's TestDatabase
// (which runs in a separate, isolated module registry per file and can
// only get the connection info back out via something outside JS memory).
export const TEST_DB_STATE_FILE = join(tmpdir(), 'recomend-test-db.json');

export const SNAPSHOT_NAME = 'migrated_template';

export const POSTGRES_IMAGE_TAG = 'recomend-test-postgres:local';
