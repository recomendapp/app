import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'bun:test';
import { createTestPerson, TestDatabase } from '@libs/testing';
import { tmdbPersonTranslation } from '@libs/db/schemas';
import type { CacheService } from '../../../common/modules/cache/cache.service';
import { PersonMetadataService } from './person-metadata.service';

class FakeCacheService {
  private readonly store = new Map<string, unknown>();
  setCallCount = 0;
  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }
  async set(key: string, value: unknown): Promise<void> {
    this.setCallCount++;
    this.store.set(key, value);
  }
  async del(key: string | string[]): Promise<void> {
    for (const k of Array.isArray(key) ? key : [key]) this.store.delete(k);
  }
}

describe('PersonMetadataService', () => {
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

  let cache: FakeCacheService;
  let service: PersonMetadataService;

  beforeEach(() => {
    cache = new FakeCacheService();
    service = new PersonMetadataService(testDb.db, cache as unknown as CacheService);
  });

  const addTranslation = (personId: number, locale: string, biography: string | null) => {
    const [iso6391, iso31661] = locale.split('-');
    return testDb.db
      .insert(tmdbPersonTranslation)
      .values({ personId, iso6391, iso31661, biography });
  };

  it('returns nothing for a person with no translation rows', async () => {
    const person = await createTestPerson(testDb.db);

    expect((await service.get(person.id)).alternates).toEqual([]);
  });

  it('lists every locale with a translated biography', async () => {
    const person = await createTestPerson(testDb.db, { name: 'Jane Doe' });
    await addTranslation(person.id, 'en-US', 'A biography.');
    await addTranslation(person.id, 'fr-FR', 'Une biographie.');

    const { alternates } = await service.get(person.id);

    expect(alternates.map((a) => a.locale)).toEqual(['en-US', 'fr-FR']);
  });

  // `person_translation` has no name column, so the slug cannot vary by locale.
  it('gives every locale the same path, since a name is never translated', async () => {
    const person = await createTestPerson(testDb.db, { name: 'Jane Doe' });
    await addTranslation(person.id, 'en-US', 'A biography.');
    await addTranslation(person.id, 'fr-FR', 'Une biographie.');

    const { alternates } = await service.get(person.id);

    expect(new Set(alternates.map((a) => a.path))).toEqual(
      new Set([`/person/${person.id}-jane-doe`]),
    );
  });

  it('excludes a locale whose biography is empty', async () => {
    const person = await createTestPerson(testDb.db);
    await addTranslation(person.id, 'fr-FR', '   ');

    expect((await service.get(person.id)).alternates).toEqual([]);
  });

  it('ignores a locale that is not in i18n.supported_languages', async () => {
    const person = await createTestPerson(testDb.db);
    await addTranslation(person.id, 'xx-XX', 'Nope.');

    expect((await service.get(person.id)).alternates).toEqual([]);
  });

  it('serves the second call from the cache without touching the database', async () => {
    const person = await createTestPerson(testDb.db, { name: 'Jane Doe' });
    await addTranslation(person.id, 'fr-FR', 'Une biographie.');

    const first = await service.get(person.id);
    await testDb.db.delete(tmdbPersonTranslation);
    const second = await service.get(person.id);

    expect(cache.setCallCount).toBe(1);
    expect(second.alternates).toEqual(first.alternates);
    expect(second.alternates[0].path).toBe(`/person/${person.id}-jane-doe`);
  });
});
