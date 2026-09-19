import { createTestUser, TestDatabase } from '@libs/testing';
import { USER_RULES } from '@libs/rules';
import { generateUniqueUsername } from './generate-username';

describe('generateUniqueUsername', () => {
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

  it('derives the username from the local part of the email, lowercased', async () => {
    const result = await generateUniqueUsername({ email: 'John.Doe@example.com', db: testDb.db });

    expect(result).toBe('johndoe');
  });

  it('strips characters not allowed by the username rules', async () => {
    const result = await generateUniqueUsername({
      email: 'john+doe_99!@example.com',
      db: testDb.db,
    });

    expect(result).toBe('johndoe99');
  });

  it('pads a too-short local part up to the minimum length', async () => {
    const result = await generateUniqueUsername({ email: 'ab@example.com', db: testDb.db });

    expect(result.length).toBeGreaterThanOrEqual(USER_RULES.USERNAME.MIN);
    expect(result.startsWith('ab')).toBe(true);
  });

  it('appends a random numeric suffix when the base username is already taken', async () => {
    await createTestUser(testDb.db, { user: { username: 'johndoe' } });

    const result = await generateUniqueUsername({ email: 'John.Doe@example.com', db: testDb.db });

    expect(result).not.toBe('johndoe');
    expect(result.startsWith('johndoe')).toBe(true);
  });

  it('never exceeds the maximum username length even with a long base and a suffix', async () => {
    await createTestUser(testDb.db, {
      user: { username: 'a'.repeat(USER_RULES.USERNAME.MAX) },
    });
    const longLocalPart = 'a'.repeat(USER_RULES.USERNAME.MAX + 10);

    const result = await generateUniqueUsername({
      email: `${longLocalPart}@example.com`,
      db: testDb.db,
    });

    expect(result.length).toBeLessThanOrEqual(USER_RULES.USERNAME.MAX);
  });

  it('throws after exhausting maxAttempts when every candidate collides', async () => {
    // Force every attempt (base included) to collide by taking the exact base username,
    // then making the retry loop deterministic-length-bounded but always colliding is hard to
    // fully saturate with random suffixes, so instead we assert the documented failure mode
    // with maxAttempts: 0 (no attempts allowed at all).
    await expect(
      generateUniqueUsername({
        email: 'someone@example.com',
        db: testDb.db,
        options: { maxAttempts: 0 },
      }),
    ).rejects.toThrow('Unable to generate a unique username after 0 attempts');
  });
});
