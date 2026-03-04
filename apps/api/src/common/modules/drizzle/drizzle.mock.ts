
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@libs/db/schemas';

export const createDrizzleMock = () => {
  return drizzle.mock({ schema });
};