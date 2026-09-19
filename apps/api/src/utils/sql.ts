import { sql, SQL, Column } from 'drizzle-orm';

export function buildJsonbObject(selectObj: Record<string, any>): SQL {
  // Accepts both plain table columns and computed `sql`-tagged fragments
  // (e.g. a CASE expression) as values — anything else (table metadata,
  // relation helpers, ...) picked up by a `{...table}` spread is dropped.
  const entries = Object.entries(selectObj).filter(
    ([, col]) => col instanceof Column || col instanceof SQL,
  );

  const pairs = entries.map(([jsKey, column]) => {
    return sql`${sql.raw(`'${jsKey}'`)}, ${column}`;
  });

  return sql`jsonb_build_object(${sql.join(pairs, sql`, `)})`;
}
