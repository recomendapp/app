import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const config = defineConfig({
  out: './libs/core/drizzle',
  schema: './libs/core/src/lib/db/schemas/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['public', 'auth', 'tmdb'],
});

export default config;
