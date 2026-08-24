export const ImportServerEvents = {
  PROGRESS: 'import:progress',
  // The Prefect flow finished staging the data — job is now awaiting_review. Not to be confused
  // with VALIDATED below, which fires once the user reviews and commits real rows.
  STAGED: 'import:staged',
  // The user called /validate and the real logMovie/logTvSeries/bookmark/playlist rows have
  // been written — this is what a collection page needs to know about to refetch.
  VALIDATED: 'import:validated',
  FAILED: 'import:failed',
} as const;

export type ImportServerEventName = (typeof ImportServerEvents)[keyof typeof ImportServerEvents];
