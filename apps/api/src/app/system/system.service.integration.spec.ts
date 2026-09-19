import { eq } from 'drizzle-orm';
import { systemConfig } from '@libs/db/schemas';
import { TestDatabase } from '@libs/testing';
import { SystemService } from './system.service';

describe('SystemService', () => {
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

  describe('getStatus', () => {
    it('reflects the seeded defaults (not under maintenance, min version 1.0.0)', async () => {
      const service = new SystemService(testDb.db);

      const result = await service.getStatus();

      expect(result.isMaintenance).toBe(false);
      expect(result.minMobileVersion).toBe('1.0.0');
    });

    it('reflects maintenance mode once flipped on', async () => {
      await testDb.db
        .update(systemConfig)
        .set({ value: true })
        .where(eq(systemConfig.key, 'is_maintenance'));
      const service = new SystemService(testDb.db);

      const result = await service.getStatus();

      expect(result.isMaintenance).toBe(true);
    });

    it('reflects an updated minimum mobile version', async () => {
      await testDb.db
        .update(systemConfig)
        .set({ value: '2.3.1' })
        .where(eq(systemConfig.key, 'min_mobile_version'));
      const service = new SystemService(testDb.db);

      const result = await service.getStatus();

      expect(result.minMobileVersion).toBe('2.3.1');
    });

    it('falls back to safe defaults when a config row is missing', async () => {
      await testDb.db.delete(systemConfig).where(eq(systemConfig.key, 'is_maintenance'));
      await testDb.db.delete(systemConfig).where(eq(systemConfig.key, 'min_mobile_version'));
      const service = new SystemService(testDb.db);

      const result = await service.getStatus();

      expect(result.isMaintenance).toBe(false);
      expect(result.minMobileVersion).toBe('1.0.0');
    });
  });
});
