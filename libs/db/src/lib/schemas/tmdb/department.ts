import { bigint, index, primaryKey, text } from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbDepartment = tmdbSchema.table('department', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  name: text().notNull(),
});

export const tmdbDepartmentTranslation = tmdbSchema.table(
  'department_translation',
  {
    departmentId: bigint('department_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbDepartment.id, { onDelete: 'cascade' }),
    language: text().notNull(),
    name: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.departmentId, table.language] }),
    index('idx_tmdb_department_translation_language').on(table.language),
  ],
);
