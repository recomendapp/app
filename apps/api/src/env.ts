import { apiSchema, validateEnv } from '@libs/env';

export const env = validateEnv(apiSchema);
