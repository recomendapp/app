export const PlaylistServerEvents = {
  CREATED: 'playlist:created',
  UPDATED: 'playlist:updated',
  DELETED: 'playlist:deleted',
  ITEM_ADDED: 'playlist:item_added',
  ITEM_UPDATED: 'playlist:item_updated',
  ITEM_DELETED: 'playlist:item_deleted',
  LIKE_SET: 'playlist:like_set',
  LIKE_DELETED: 'playlist:like_deleted',
  SAVE_SET: 'playlist:save_set',
  SAVE_DELETED: 'playlist:save_deleted',
} as const;

export type PlaylistServerEventName =
  (typeof PlaylistServerEvents)[keyof typeof PlaylistServerEvents];
