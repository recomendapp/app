import {
  bigint,
  foreignKey,
  index,
  integer,
  real,
  text,
} from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';

export const tmdbCompany = tmdbSchema.table(
  'company',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    name: text('name'),
    description: text('description'),
    headquarters: text('headquarters'),
    homepage: text('homepage'),
    originCountry: text('origin_country'),
    parentCompanyId: bigint('parent_company', { mode: 'number' }),
  },
  (table) => [
    foreignKey({
      columns: [table.parentCompanyId],
      foreignColumns: [table.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ],
);

export const tmdbCompanyAlternativeName = tmdbSchema.table(
  'company_alternative_name',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    companyId: bigint('company_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbCompany.id, { onDelete: 'cascade' }),
    name: text().notNull(),
  },
  (table) => [
    index('idx_tmdb_company_alternative_name_company_id').on(table.companyId),
  ],
);

export const tmdbCompanyImage = tmdbSchema.table(
  'company_image',
  {
    id: text().primaryKey(),
    companyId: bigint('company_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbCompany.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    fileType: text('file_type').notNull(),
    aspectRatio: real('aspect_ratio'),
    height: integer(),
    width: integer(),
    voteAverage: real('vote_average'),
    voteCount: integer('vote_count'),
  },
  (table) => [
    index('idx_tmdb_company_image_company_id').on(table.companyId),
    index('idx_tmdb_company_image_vote_average').on(table.voteAverage),
  ],
);
