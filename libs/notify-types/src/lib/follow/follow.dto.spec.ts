import { NotifyFollowNewSchema } from './follow.dto';

describe('NotifyFollowNewSchema', () => {
  const validUuid = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

  it('accepts two valid uuids', () => {
    const result = NotifyFollowNewSchema.safeParse({ actorId: validUuid, targetUserId: validUuid });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid actorId', () => {
    const result = NotifyFollowNewSchema.safeParse({
      actorId: 'not-a-uuid',
      targetUserId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing targetUserId', () => {
    const result = NotifyFollowNewSchema.safeParse({ actorId: validUuid });
    expect(result.success).toBe(false);
  });
});
