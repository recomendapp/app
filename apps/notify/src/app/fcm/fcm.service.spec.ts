import { FcmService } from './fcm.service';

describe('FcmService', () => {
  function createService(sendEachForMulticast: jest.Mock) {
    const messaging = { sendEachForMulticast } as any;
    return new FcmService(messaging);
  }

  it('returns an empty array and never calls the SDK when there are no tokens', async () => {
    const sendEachForMulticast = jest.fn();
    const service = createService(sendEachForMulticast);

    const result = await service.sendMulticast([], 'title', 'body');

    expect(result).toEqual([]);
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('sends a multicast with the given title/body/data and returns no failed tokens on success', async () => {
    const sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0, responses: [] });
    const service = createService(sendEachForMulticast);

    const result = await service.sendMulticast(
      ['token-1', 'token-2'],
      'Hello',
      'World',
      { url: '/some/path' },
      'https://example.com/image.png',
    );

    expect(result).toEqual([]);
    expect(sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['token-1', 'token-2'],
      notification: { title: 'Hello', body: 'World', imageUrl: 'https://example.com/image.png' },
      data: { url: '/some/path' },
      android: {
        priority: 'high',
        notification: { imageUrl: 'https://example.com/image.png' },
      },
      webpush: { fcmOptions: { link: '/some/path' } },
    });
  });

  it('omits android.notification and webpush when there is no imageUrl/data.url', async () => {
    const sendEachForMulticast = jest.fn().mockResolvedValue({ failureCount: 0, responses: [] });
    const service = createService(sendEachForMulticast);

    await service.sendMulticast(['token-1'], 'Hello', 'World');

    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        android: { priority: 'high', notification: undefined },
        webpush: undefined,
      }),
    );
  });

  it('returns only the tokens whose response failed on partial failure', async () => {
    const sendEachForMulticast = jest.fn().mockResolvedValue({
      failureCount: 1,
      responses: [{ success: true }, { success: false }],
    });
    const service = createService(sendEachForMulticast);

    const result = await service.sendMulticast(['token-1', 'token-2'], 'Hello', 'World');

    expect(result).toEqual(['token-2']);
  });

  it('treats a thrown SDK error as every token failing', async () => {
    const sendEachForMulticast = jest.fn().mockRejectedValue(new Error('network down'));
    const service = createService(sendEachForMulticast);

    const result = await service.sendMulticast(['token-1', 'token-2'], 'Hello', 'World');

    expect(result).toEqual(['token-1', 'token-2']);
  });
});
