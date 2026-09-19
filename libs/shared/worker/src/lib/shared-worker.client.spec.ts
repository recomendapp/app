import { WorkerClient } from './shared-worker.client';

describe('WorkerClient', () => {
  function createClient() {
    const searchQueue = { add: jest.fn().mockResolvedValue(undefined) };
    const client = new WorkerClient(searchQueue as any);
    return { client, searchQueue };
  }

  it('validates the payload against the job schema and enqueues the parsed result', async () => {
    const { client, searchQueue } = createClient();
    const userId = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

    await client.emit('search:sync-user', { userId, action: 'upsert' });

    expect(searchQueue.add).toHaveBeenCalledTimes(1);
    const [jobName, payload] = searchQueue.add.mock.calls[0];
    expect(jobName).toBe('search:sync-user');
    expect(payload).toEqual({ userId, action: 'upsert' });
  });

  it('strips unknown fields via schema.parse before enqueueing', async () => {
    const { client, searchQueue } = createClient();
    const userId = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

    await client.emit('search:sync-user', {
      userId,
      action: 'upsert',
      extraField: 'should be stripped',
    } as any);

    const [, payload] = searchQueue.add.mock.calls[0];
    expect(payload).toEqual({ userId, action: 'upsert' });
  });

  it('throws and never enqueues when the payload fails schema validation', async () => {
    const { client, searchQueue } = createClient();

    await expect(
      client.emit('search:sync-user', { userId: 'not-a-uuid', action: 'upsert' } as any),
    ).rejects.toThrow();

    expect(searchQueue.add).not.toHaveBeenCalled();
  });

  it('throws for an unknown job prefix and never enqueues', async () => {
    const { client, searchQueue } = createClient();

    await expect(client.emit('billing:charge' as any, {} as any)).rejects.toThrow(
      'Unknown job prefix: billing',
    );
    expect(searchQueue.add).not.toHaveBeenCalled();
  });

  it('applies default job options (attempts/backoff/removeOnComplete/removeOnFail)', async () => {
    const { client, searchQueue } = createClient();
    const userId = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

    await client.emit('search:sync-user', { userId, action: 'upsert' });

    const [, , options] = searchQueue.add.mock.calls[0];
    expect(options).toEqual({
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  it('lets caller-supplied options override the defaults', async () => {
    const { client, searchQueue } = createClient();
    const userId = '3f6b6a2e-6d8b-4b3a-9f0e-2a2b7e6c9d1a';

    await client.emit('search:sync-user', { userId, action: 'upsert' }, { attempts: 1 });

    const [, , options] = searchQueue.add.mock.calls[0];
    expect(options.attempts).toBe(1);
  });

  it('routes search:sync-playlist jobs to the search queue as well', async () => {
    const { client, searchQueue } = createClient();

    await client.emit('search:sync-playlist', { playlistId: 42, action: 'delete' });

    expect(searchQueue.add).toHaveBeenCalledWith(
      'search:sync-playlist',
      { playlistId: 42, action: 'delete' },
      expect.any(Object),
    );
  });
});
