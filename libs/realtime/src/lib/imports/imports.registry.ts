export const ImportServerEvents = {
  CREATED: 'import:created',
  PROGRESS: 'import:progress',
  STAGED: 'import:staged',
  VALIDATED: 'import:validated',
  FAILED: 'import:failed',
  DELETED: 'import:deleted',
} as const;

export type ImportServerEventName = (typeof ImportServerEvents)[keyof typeof ImportServerEvents];
