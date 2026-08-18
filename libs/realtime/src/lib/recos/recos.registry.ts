export const RecoServerEvents = {
  SENT: 'reco:sent',
  RECEIVED: 'reco:received',
  DELETED: 'reco:deleted',
} as const;

export type RecoServerEventName = (typeof RecoServerEvents)[keyof typeof RecoServerEvents];
