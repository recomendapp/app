import { NotFoundException } from '@nestjs/common';
import { createTestExplore, TestDatabase } from '@libs/testing';
import { ExploreService } from './explore.service';

describe('ExploreService', () => {
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

  describe('get', () => {
    it('gets an explore map by numeric id', async () => {
      const explore = await createTestExplore(testDb.db, {
        name: 'Paris on Screen',
        slug: 'paris-on-screen',
      });
      const service = new ExploreService(testDb.db);

      const result = await service.get(String(explore.id));

      expect(result.id).toBe(explore.id);
      expect(result.name).toBe('Paris on Screen');
      expect(result.slug).toBe('paris-on-screen');
    });

    it('gets an explore map by slug', async () => {
      const explore = await createTestExplore(testDb.db, { slug: 'tokyo-tour' });
      const service = new ExploreService(testDb.db);

      const result = await service.get('tokyo-tour');

      expect(result.id).toBe(explore.id);
      expect(result.slug).toBe('tokyo-tour');
    });

    it('throws when no explore map matches the numeric id', async () => {
      const service = new ExploreService(testDb.db);

      await expect(service.get('999999')).rejects.toThrow(NotFoundException);
    });

    it('throws when no explore map matches the slug', async () => {
      const service = new ExploreService(testDb.db);

      await expect(service.get('does-not-exist')).rejects.toThrow(NotFoundException);
    });

    it('prefers the numeric id lookup over a slug that happens to be all digits', async () => {
      const explore = await createTestExplore(testDb.db, { slug: '12345' });
      const service = new ExploreService(testDb.db);

      // The identifier "12345" is fully numeric, so the service looks it up
      // by id, not by slug — even though a row with that exact slug exists,
      // its numeric id is different, so this must 404.
      await expect(service.get('12345')).rejects.toThrow(NotFoundException);
      expect(explore.id).not.toBe(12345);
    });
  });

  describe('resolveId', () => {
    it('resolves a numeric id to itself', async () => {
      const explore = await createTestExplore(testDb.db);
      const service = new ExploreService(testDb.db);

      await expect(service.resolveId(String(explore.id))).resolves.toBe(explore.id);
    });

    it('resolves a slug to its numeric id', async () => {
      const explore = await createTestExplore(testDb.db, { slug: 'berlin-walks' });
      const service = new ExploreService(testDb.db);

      await expect(service.resolveId('berlin-walks')).resolves.toBe(explore.id);
    });

    it('throws when the identifier does not resolve', async () => {
      const service = new ExploreService(testDb.db);

      await expect(service.resolveId('nope')).rejects.toThrow(NotFoundException);
    });
  });
});
