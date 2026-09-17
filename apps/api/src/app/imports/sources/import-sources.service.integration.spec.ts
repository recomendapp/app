import { createTestImportSource, createTestProvider, TestDatabase } from '@libs/testing';
import { ImportSourcesService } from './import-sources.service';

describe('ImportSourcesService', () => {
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

  // The seed snapshot every test starts from already ships one real import source
  // ("letterboxd", position 0) — assertions filter it out instead of assuming an empty table.
  const isSeeded = (slug: string) => slug === 'letterboxd';

  describe('listAll', () => {
    it('includes the seeded letterboxd source by default', async () => {
      const service = new ImportSourcesService(testDb.db);

      const result = await service.listAll();

      expect(result.map((r) => r.provider.slug)).toContain('letterboxd');
    });

    it('lists sources ordered by position, with the provider attached', async () => {
      const providerA = await createTestProvider(testDb.db, { slug: 'test-a', name: 'Test A' });
      const providerB = await createTestProvider(testDb.db, { slug: 'test-b', name: 'Test B' });
      await createTestImportSource(testDb.db, { providerId: providerA.id }, { position: 2 });
      await createTestImportSource(testDb.db, { providerId: providerB.id }, { position: 1 });
      const service = new ImportSourcesService(testDb.db);

      const result = await service.listAll();
      const ours = result.filter((r) => !isSeeded(r.provider.slug));

      expect(ours.map((r) => r.provider.slug)).toEqual(['test-b', 'test-a']);
    });

    it('includes disabled sources (filtering is a client concern)', async () => {
      const provider = await createTestProvider(testDb.db);
      await createTestImportSource(testDb.db, { providerId: provider.id }, { enabled: false });
      const service = new ImportSourcesService(testDb.db);

      const result = await service.listAll();
      const ours = result.find((r) => r.provider.slug === provider.slug);

      expect(ours?.enabled).toBe(false);
    });

    it('carries instructions and fileTypes through', async () => {
      const provider = await createTestProvider(testDb.db);
      await createTestImportSource(
        testDb.db,
        { providerId: provider.id },
        { instructions: '1. Export your data\n2. Upload it here', fileTypes: ['zip', 'csv'] },
      );
      const service = new ImportSourcesService(testDb.db);

      const result = await service.listAll();
      const ours = result.find((r) => r.provider.slug === provider.slug);

      expect(ours?.instructions).toBe('1. Export your data\n2. Upload it here');
      expect(ours?.fileTypes).toEqual(['zip', 'csv']);
    });
  });
});
