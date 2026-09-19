jest.mock('../../env', () => ({
  env: { APNS_BUNDLE_ID: 'com.recomend.test' },
}));

import { ApnsService } from './apns.service';

describe('ApnsService', () => {
  function createService(send: jest.Mock) {
    const apnProvider = { send } as any;
    return new ApnsService(apnProvider);
  }

  it('returns an empty array and never calls the SDK when there are no tokens', async () => {
    const send = jest.fn();
    const service = createService(send);

    const result = await service.sendToDevices([], 'title', 'body');

    expect(result).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it('builds a notification with the given title/body/data and topic, and returns no failed tokens on success', async () => {
    const send = jest.fn().mockResolvedValue({ failed: [] });
    const service = createService(send);

    const result = await service.sendToDevices(['device-1'], 'Hello', 'World', { url: '/path' });

    expect(result).toEqual([]);
    expect(send).toHaveBeenCalledTimes(1);
    const [note, tokens] = send.mock.calls[0];
    expect(tokens).toEqual(['device-1']);
    expect(note.aps.alert).toEqual({ title: 'Hello', body: 'World' });
    expect(note.payload).toEqual({
      data: { url: '/path' },
      avatarUrl: undefined,
      senderName: undefined,
      senderId: undefined,
      attachmentUrl: undefined,
    });
    expect(note.topic).toBe('com.recomend.test');
    expect(note.aps['mutable-content']).toBeFalsy();
  });

  it('nests avatar/attachment data under payload and enables mutableContent when an avatar is present', async () => {
    const send = jest.fn().mockResolvedValue({ failed: [] });
    const service = createService(send);

    await service.sendToDevices(['device-1'], 'Hello', 'World', undefined, {
      avatar: { url: 'https://example.com/a.png', name: 'Alice', id: 'user-1' },
    });

    const [note] = send.mock.calls[0];
    expect(note.payload.avatarUrl).toBe('https://example.com/a.png');
    expect(note.payload.senderName).toBe('Alice');
    expect(note.payload.senderId).toBe('user-1');
    expect(note.aps['mutable-content']).toBe(1);
  });

  it('enables mutableContent when only an attachmentUrl is present', async () => {
    const send = jest.fn().mockResolvedValue({ failed: [] });
    const service = createService(send);

    await service.sendToDevices(['device-1'], 'Hello', 'World', undefined, {
      attachmentUrl: 'https://example.com/poster.png',
    });

    const [note] = send.mock.calls[0];
    expect(note.payload.attachmentUrl).toBe('https://example.com/poster.png');
    expect(note.aps['mutable-content']).toBe(1);
  });

  it('returns the device tokens for entries reported as failed', async () => {
    const send = jest.fn().mockResolvedValue({
      failed: [
        { device: 'device-1', error: new Error('bad token') },
        { device: 'device-2', status: '410' },
        { device: 'device-3' },
      ],
    });
    const service = createService(send);

    const result = await service.sendToDevices(
      ['device-1', 'device-2', 'device-3'],
      'Hello',
      'World',
    );

    expect(result).toEqual(['device-1', 'device-2', 'device-3']);
  });

  it('treats a thrown SDK error as every token failing', async () => {
    const send = jest.fn().mockRejectedValue(new Error('network down'));
    const service = createService(send);

    const result = await service.sendToDevices(['device-1', 'device-2'], 'Hello', 'World');

    expect(result).toEqual(['device-1', 'device-2']);
  });
});
