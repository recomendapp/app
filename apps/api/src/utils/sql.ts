import { sql, SQL, Column } from "drizzle-orm";

export function buildJsonbObject(selectObj: Record<string, any>): SQL {
  const entries = Object.entries(selectObj).filter(
    ([, col]) => col instanceof Column
  );

  const pairs = entries.map(([jsKey, column]) => {
    return sql`${sql.raw(`'${jsKey}'`)}, ${column}`;
  });

  return sql`jsonb_build_object(${sql.join(pairs, sql`, `)})`;
}