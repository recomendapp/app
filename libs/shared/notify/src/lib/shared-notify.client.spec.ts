import { NotifyClient } from './shared-notify.client';

describe('NotifyClient', () => {
  function createClient() {
    const queue = { add: jest.fn().mockResolvedValue(undefined) };
    const client = new NotifyClient(queue as any);
    return { client, queue };
  }

  it('adds the job to the queue with the job name and data', async () => {
    const { client, queue } = createClient();
    const data = { actorId: 'user-1', targetUserId: 'user-2' };

    await client.emit('follow:new', data);

    expect(queue.add).toHaveBeenCalledTimes(1);
    const [jobName, payload] = queue.add.mock.calls[0];
    expect(jobName).toBe('follow:new');
    expect(payload).toEqual(data);
  });

  it('applies default job options (attempts/backoff/removeOnComplete/removeOnFail)', async () => {
    const { client, queue } = createClient();

    await client.emit('follow:new', { actorId: 'user-1', targetUserId: 'user-2' });

    const [, , options] = queue.add.mock.calls[0];
    expect(options).toEqual({
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  });

  it('lets caller-supplied options override the defaults', async () => {
    const { client, queue } = createClient();

    await client.emit(
      'follow:new',
      { actorId: 'user-1', targetUserId: 'user-2' },
      { attempts: 5, removeOnComplete: false },
    );

    const [, , options] = queue.add.mock.calls[0];
    expect(options).toEqual({
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: false,
      removeOnFail: false,
    });
  });

  it('does not validate the payload against a schema before enqueueing', async () => {
    // Unlike WorkerClient (libs/shared/worker), NotifyClient has no schema
    // registry to validate against, so malformed data is passed straight
    // through to the queue. Documenting this asymmetry rather than "fixing"
    // it unilaterally, since building out a NotifySchemas registry mirroring
    // WorkerSchemas is a real feature addition, not a narrow bug fix.
    const { client, queue } = createClient();

    await client.emit('follow:new', { actorId: 123, targetUserId: null } as any);

    expect(queue.add).toHaveBeenCalledTimes(1);
    const [, payload] = queue.add.mock.calls[0];
    expect(payload).toEqual({ actorId: 123, targetUserId: null });
  });
});
