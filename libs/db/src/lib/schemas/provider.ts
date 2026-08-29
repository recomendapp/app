import { bigint, pgTable, text } from 'drizzle-orm/pg-core';

export const provider = pgTable('provider', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  iconLight: text('icon_light'),
  iconDark: text('icon_dark'),
});
