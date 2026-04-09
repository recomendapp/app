import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const config = defineConfig({
  out: './libs/db/drizzle',
  schema: './libs/db/src/lib/schemas/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  schemaFilter: ['public', 'extensions', 'auth', 'tmdb', 'i18n', 'ui'],
});

export default config;
