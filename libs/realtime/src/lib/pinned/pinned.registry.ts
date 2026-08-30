export const PinnedServerEvents = {
  SET: 'pinned:set',
  REORDERED: 'pinned:reordered',
  DELETED: 'pinned:deleted',
} as const;

export type PinnedServerEventName = (typeof PinnedServerEvents)[keyof typeof PinnedServerEvents];
