import { NotifyRecoCompletedSchema, NotifyRecoReceivedSchema } from './reco.dto';

const validUuid = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

describe('NotifyRecoReceivedSchema', () => {
  const valid = {
    senderId: validUuid,
    receiverIds: [validUuid],
    mediaId: 1,
    type: 'movie' as const,
  };

  it('accepts a valid payload without a comment', () => {
    expect(NotifyRecoReceivedSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a string comment, a null comment, and an omitted comment', () => {
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, comment: 'nice!' }).success).toBe(true);
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, comment: null }).success).toBe(true);
    expect(NotifyRecoReceivedSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts both media types', () => {
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, type: 'movie' }).success).toBe(true);
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, type: 'tv_series' }).success).toBe(true);
  });

  it('rejects an unrecognized media type', () => {
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, type: 'documentary' }).success).toBe(
      false,
    );
  });

  it('rejects a zero or negative mediaId', () => {
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, mediaId: 0 }).success).toBe(false);
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, mediaId: -1 }).success).toBe(false);
  });

  it('rejects a non-integer mediaId', () => {
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, mediaId: 1.5 }).success).toBe(false);
  });

  it('accepts an empty receiverIds array (callers/consumers decide whether that is a no-op)', () => {
    expect(NotifyRecoReceivedSchema.safeParse({ ...valid, receiverIds: [] }).success).toBe(true);
  });

  it('rejects a non-uuid entry inside receiverIds', () => {
    expect(
      NotifyRecoReceivedSchema.safeParse({ ...valid, receiverIds: ['not-a-uuid'] }).success,
    ).toBe(false);
  });
});

describe('NotifyRecoCompletedSchema', () => {
  const valid = {
    userId: validUuid,
    senderIds: [validUuid],
    mediaId: 1,
    type: 'tv_series' as const,
  };

  it('accepts a valid payload', () => {
    expect(NotifyRecoCompletedSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing userId', () => {
    const { userId, ...rest } = valid;
    expect(NotifyRecoCompletedSchema.safeParse(rest).success).toBe(false);
  });
});
