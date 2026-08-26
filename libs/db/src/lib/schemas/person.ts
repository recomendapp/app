import { relations } from 'drizzle-orm';
import { bigint, index, pgTable, timestamp, unique } from 'drizzle-orm/pg-core';
import { tmdbPerson } from './tmdb';

export const person = pgTable('person', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});
export const personRelations = relations(person, ({ one }) => ({
  tmdbLink: one(personTmdbLink, {
    fields: [person.id],
    references: [personTmdbLink.personId],
  }),
}));

export const personTmdbLink = pgTable(
  'person_tmdb_link',
  {
    tmdbPersonId: bigint('tmdb_person_id', { mode: 'number' })
      .primaryKey()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => person.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_person_tmdb_link_person_id').on(table.personId),
    index('idx_person_tmdb_link_person_id').on(table.personId),
  ],
);
export const personTmdbLinkRelations = relations(personTmdbLink, ({ one }) => ({
  person: one(person, {
    fields: [personTmdbLink.personId],
    references: [person.id],
  }),
  tmdbPerson: one(tmdbPerson, {
    fields: [personTmdbLink.tmdbPersonId],
    references: [tmdbPerson.id],
  }),
}));
