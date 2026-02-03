import { mailerSchema, validateEnv } from '@libs/env';

export const env = validateEnv(mailerSchema);
