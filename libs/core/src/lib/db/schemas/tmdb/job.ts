import { bigint, index, primaryKey, text } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';
import { tmdbDepartment } from './department';

export const tmdbJob = tmdbSchema.table(
  'job',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    departmentId: bigint('department_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbDepartment.id, { onDelete: 'cascade' }),
    name: text().notNull(),
  },
  (table) => [index('idx_tmdb_job_department_id').on(table.departmentId)],
);

export const tmdbJobTranslation = tmdbSchema.table(
  'job_translation',
  {
    jobId: bigint('job_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbJob.id, { onDelete: 'cascade' }),
    language: text().notNull(),
    name: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.jobId, table.language] }),
    index('idx_tmdb_job_translation_language').on(table.language),
  ],
);
