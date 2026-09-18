import { NotFoundException } from '@nestjs/common';
import { followPerson } from '@libs/db/schemas';
import { createTestPerson, createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { PersonFollowServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../realtime/realtime.gateway';

jest.mock('../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { PersonsService } = require('./persons.service') as typeof import('./persons.service');

describe('PersonsService', () => {
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

  const fakeGateway = () => ({ emitToUser: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;
  const service = (gateway?: jest.Mocked<RealtimeGateway>) =>
    new (PersonsService as new (
      db: typeof testDb.db,
      gateway: RealtimeGateway,
    ) => InstanceType<typeof PersonsService>)(testDb.db, gateway ?? fakeGateway());

  describe('get', () => {
    it('throws when the person does not exist', async () => {
      await expect(
        service().get({ personId: 999999, currentUser: null, locale: defaultSupportedLocale }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the person', async () => {
      const person = await createTestPerson(testDb.db, { name: 'Test Person' });

      const result = await service().get({
        personId: person.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.id).toBe(person.id);
      expect(result.name).toBe('Test Person');
    });

    it('resolves when called with a current user', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);

      const result = await service().get({
        personId: person.id,
        currentUser: user as never,
        locale: defaultSupportedLocale,
      });

      expect(result.id).toBe(person.id);
    });
  });

  describe('getFollowStatus', () => {
    it('returns null when there is no follow relationship', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);

      const result = await service().getFollowStatus(user.id, person.id);

      expect(result).toBeNull();
    });

    it('returns the follow relationship when it exists', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      await testDb.db.insert(followPerson).values({ userId: user.id, personId: person.id });

      const result = await service().getFollowStatus(user.id, person.id);

      expect(result).toMatchObject({ userId: user.id, personId: person.id });
    });

    it('does not leak another user follow relationship', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      await testDb.db.insert(followPerson).values({ userId: owner.id, personId: person.id });

      const result = await service().getFollowStatus(other.id, person.id);

      expect(result).toBeNull();
    });
  });

  describe('follow', () => {
    it('creates a follow relationship and emits an event', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const gateway = fakeGateway();

      const result = await service(gateway).follow(user.id, person.id);

      expect(result).toMatchObject({ userId: user.id, personId: person.id });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PersonFollowServerEvents.SET,
        result,
      );

      const stored = await testDb.db.query.followPerson.findFirst({
        where: (fp, { and, eq }) => and(eq(fp.userId, user.id), eq(fp.personId, person.id)),
      });
      expect(stored).toBeDefined();
    });

    it('is idempotent and does not emit again when already following', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      await service().follow(user.id, person.id);

      const gateway = fakeGateway();
      await service(gateway).follow(user.id, person.id);

      expect(gateway.emitToUser).not.toHaveBeenCalled();

      const rows = await testDb.db.query.followPerson.findMany({
        where: (fp, { and, eq }) => and(eq(fp.userId, user.id), eq(fp.personId, person.id)),
      });
      expect(rows).toHaveLength(1);
    });
  });

  describe('unfollow', () => {
    it('throws when there is no follow relationship', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);

      await expect(service().unfollow(user.id, person.id)).rejects.toThrow(NotFoundException);
    });

    it('deletes the follow relationship and emits an event', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      await testDb.db.insert(followPerson).values({ userId: user.id, personId: person.id });
      const gateway = fakeGateway();

      const result = await service(gateway).unfollow(user.id, person.id);

      expect(result).toMatchObject({ userId: user.id, personId: person.id });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PersonFollowServerEvents.DELETED,
        result,
      );

      const stored = await testDb.db.query.followPerson.findFirst({
        where: (fp, { and, eq }) => and(eq(fp.userId, user.id), eq(fp.personId, person.id)),
      });
      expect(stored).toBeUndefined();
    });

    it('does not delete another user follow relationship', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      await testDb.db.insert(followPerson).values({ userId: owner.id, personId: person.id });

      await expect(service().unfollow(other.id, person.id)).rejects.toThrow(NotFoundException);

      const stored = await testDb.db.query.followPerson.findFirst({
        where: (fp, { and, eq }) => and(eq(fp.userId, owner.id), eq(fp.personId, person.id)),
      });
      expect(stored).toBeDefined();
    });
  });
});
