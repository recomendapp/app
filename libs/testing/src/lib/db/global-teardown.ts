import { rmSync } from 'node:fs';
import { TEST_DB_STATE_FILE } from './constants';

/**
 * Jest `globalTeardown` for the `test-integration` project. Purely tidies
 * up the handoff file — the container itself is left to Ryuk (see
 * global-setup.ts) since this runs in a separate module instance that
 * never held a reference to it.
 */
export default async function globalTeardown(): Promise<void> {
  rmSync(TEST_DB_STATE_FILE, { force: true });
}
