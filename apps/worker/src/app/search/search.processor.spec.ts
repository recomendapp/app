import { SearchProcessor } from './search.processor';

describe('SearchProcessor', () => {
  function createProcessor() {
    const searchService = {
      syncUser: jest.fn().mockResolvedValue(undefined),
      syncPlaylist: jest.fn().mockResolvedValue(undefined),
    };
    const processor = new SearchProcessor(searchService as any);
    return { processor, searchService };
  }

  it('dispatches search:sync-user jobs to SearchService.syncUser', async () => {
    const { processor, searchService } = createProcessor();
    const data = { userId: 'user-1', action: 'upsert' as const };

    await processor.process({ name: 'search:sync-user', id: '1', data } as any);

    expect(searchService.syncUser).toHaveBeenCalledWith(data);
    expect(searchService.syncPlaylist).not.toHaveBeenCalled();
  });

  it('dispatches search:sync-playlist jobs to SearchService.syncPlaylist', async () => {
    const { processor, searchService } = createProcessor();
    const data = { playlistId: 1, action: 'delete' as const };

    await processor.process({ name: 'search:sync-playlist', id: '2', data } as any);

    expect(searchService.syncPlaylist).toHaveBeenCalledWith(data);
    expect(searchService.syncUser).not.toHaveBeenCalled();
  });

  it('logs a warning and does nothing for an unhandled job name', async () => {
    const { processor, searchService } = createProcessor();

    await expect(
      processor.process({ name: 'something:unknown', id: '3', data: {} } as any),
    ).resolves.toBeUndefined();

    expect(searchService.syncUser).not.toHaveBeenCalled();
    expect(searchService.syncPlaylist).not.toHaveBeenCalled();
  });

  it('rethrows errors from the search service so BullMQ can retry the job', async () => {
    const { processor, searchService } = createProcessor();
    searchService.syncUser.mockRejectedValue(new Error('sync failed'));

    await expect(
      processor.process({
        name: 'search:sync-user',
        id: '4',
        data: { userId: 'user-1', action: 'upsert' },
      } as any),
    ).rejects.toThrow('sync failed');
  });
});
