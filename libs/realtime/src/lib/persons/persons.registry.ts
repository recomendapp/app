export const PersonFollowServerEvents = {
  SET: 'person_follow:set',
  DELETED: 'person_follow:deleted',
} as const;

export type PersonFollowServerEventName =
  (typeof PersonFollowServerEvents)[keyof typeof PersonFollowServerEvents];
