import { authSchema, validateEnv } from '@api/env';

export const env = validateEnv(authSchema);
