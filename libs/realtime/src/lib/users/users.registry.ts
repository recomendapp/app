export const UserFollowServerEvents = {
  SET: 'user_follow:set',
  DELETED: 'user_follow:deleted',
  ACCEPTED: 'user_follow:accepted',
  DECLINED: 'user_follow:declined',
} as const;

export type UserFollowServerEventName =
  (typeof UserFollowServerEvents)[keyof typeof UserFollowServerEvents];
