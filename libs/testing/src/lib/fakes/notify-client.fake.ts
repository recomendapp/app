import { mock } from 'bun:test';
import type { Mocked } from '../mocks';
import type { NotifyClient } from '@shared/notify';

/**
 * A mock-backed stand-in for `NotifyClient`, for constructing services
 * directly (`new SomeService(testDb.db, createFakeNotifyClient())`) without
 * wiring up a real BullMQ queue/Redis connection.
 *
 * The cast is necessary rather than a design smell: `NotifyClient` has a
 * `private readonly queue` field from its constructor, so TS's nominal
 * check on class types rejects a structurally-matching object literal even
 * though only the public `emit` method is ever called in tests.
 */
export function createFakeNotifyClient(): Mocked<NotifyClient> {
  return {
    emit: mock().mockResolvedValue(undefined),
  } as unknown as Mocked<NotifyClient>;
}
