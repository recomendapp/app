import { gatewaySchema, validateEnv } from '@api/env';

export const env = validateEnv(gatewaySchema);
