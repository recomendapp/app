export const BookmarkServerEvents = {
  SET: 'bookmark:set',
  DELETED: 'bookmark:deleted',
} as const;

export type BookmarkServerEventName =
  (typeof BookmarkServerEvents)[keyof typeof BookmarkServerEvents];
