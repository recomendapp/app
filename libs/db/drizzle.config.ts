import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const config = defineConfig({
  out: './libs/db/drizzle',
  schema: './libs/db/src/lib/schemas/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['public', 'auth', 'tmdb', 'i18n', 'ui'],
});

export default config;
