function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function createFakeSocket() {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };
}

const ioMock = jest.fn();

jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => ioMock(...args),
}));

import { realtime } from './realtime';
import { BookmarkServerEvents } from '@libs/realtime';

describe('RealtimeManager', () => {
  beforeEach(() => {
    ioMock.mockReset();
    realtime.disconnect();
    realtime.setConfig({ baseUrl: 'https://api.example.com', getAuthCookie: () => null });
  });

  describe('connect', () => {
    it('opens a socket against the realtime namespace, disabled auto-connect, then connects manually', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);

      await realtime.connect();

      expect(ioMock).toHaveBeenCalledWith(
        'https://api.example.com/realtime',
        expect.objectContaining({ autoConnect: false, withCredentials: true }),
      );
      expect(fakeSocket.connect).toHaveBeenCalledTimes(1);
    });

    it('is idempotent: concurrent connect() calls only open one socket', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);

      const [a, b] = await Promise.all([realtime.connect(), realtime.connect()]);

      expect(ioMock).toHaveBeenCalledTimes(1);
      expect(a).toBe(fakeSocket);
      expect(b).toBe(fakeSocket);
    });

    it('reuses the existing socket on a subsequent connect() after the first resolved', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);

      await realtime.connect();
      await realtime.connect();

      expect(ioMock).toHaveBeenCalledTimes(1);
    });

    it('sends the resolved auth cookie as a header when getAuthCookie is configured', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);
      realtime.setConfig({ getAuthCookie: () => 'session=abc123' });

      await realtime.connect();

      expect(ioMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ extraHeaders: { Cookie: 'session=abc123' } }),
      );
    });

    it('sends no cookie header when getAuthCookie resolves to null', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);

      await realtime.connect();

      expect(ioMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ extraHeaders: {} }),
      );
    });

    it('falls back gracefully to the raw base url when it cannot be parsed', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      realtime.setConfig({ baseUrl: 'not a valid url' });

      await expect(realtime.connect()).resolves.toBe(fakeSocket);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('disconnects the socket and clears internal state so the next connect() opens a fresh one', async () => {
      const fakeSocket1 = createFakeSocket();
      ioMock.mockReturnValueOnce(fakeSocket1);
      await realtime.connect();

      realtime.disconnect();

      expect(fakeSocket1.disconnect).toHaveBeenCalledTimes(1);

      const fakeSocket2 = createFakeSocket();
      ioMock.mockReturnValueOnce(fakeSocket2);
      const reconnected = await realtime.connect();

      expect(ioMock).toHaveBeenCalledTimes(2);
      expect(reconnected).toBe(fakeSocket2);
    });
  });

  describe('onBookmarkEvents', () => {
    it('registers the provided callbacks on the shared socket once connected', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);
      const onBookmarkSet = jest.fn();
      const onBookmarkDeleted = jest.fn();

      realtime.onBookmarkEvents({ onBookmarkSet, onBookmarkDeleted });
      await flushPromises();

      expect(fakeSocket.on).toHaveBeenCalledWith(BookmarkServerEvents.SET, onBookmarkSet);
      expect(fakeSocket.on).toHaveBeenCalledWith(BookmarkServerEvents.DELETED, onBookmarkDeleted);
    });

    it('only registers callbacks that were actually provided', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);
      const onBookmarkSet = jest.fn();

      realtime.onBookmarkEvents({ onBookmarkSet });
      await flushPromises();

      expect(fakeSocket.on).toHaveBeenCalledWith(BookmarkServerEvents.SET, onBookmarkSet);
      expect(fakeSocket.on).not.toHaveBeenCalledWith(
        BookmarkServerEvents.DELETED,
        expect.anything(),
      );
    });

    it('the returned unsubscribe function detaches every registered callback', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);
      const onBookmarkSet = jest.fn();
      const onBookmarkDeleted = jest.fn();

      const unsubscribe = realtime.onBookmarkEvents({ onBookmarkSet, onBookmarkDeleted });
      await flushPromises();

      unsubscribe();

      expect(fakeSocket.off).toHaveBeenCalledWith(BookmarkServerEvents.SET, onBookmarkSet);
      expect(fakeSocket.off).toHaveBeenCalledWith(BookmarkServerEvents.DELETED, onBookmarkDeleted);
    });

    it('never attaches listeners if unsubscribed before the connection resolves', async () => {
      const fakeSocket = createFakeSocket();
      ioMock.mockReturnValue(fakeSocket);
      const onBookmarkSet = jest.fn();

      const unsubscribe = realtime.onBookmarkEvents({ onBookmarkSet });
      unsubscribe();
      await flushPromises();

      expect(fakeSocket.on).not.toHaveBeenCalled();
    });
  });
});
