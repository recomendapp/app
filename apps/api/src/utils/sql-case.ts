import { SQL, sql, type AnyColumn } from 'drizzle-orm';

type SQLExpression<T = unknown> =
  | SQL<T>
  | SQL.Aliased<T>
  | AnyColumn<{ data: T }>;

export class SQLCaseWhen<T = never> {
  cases: SQL<T>;
  
  constructor(init?: SQL<T> | SQLCaseWhen<T>) {
    this.cases = init
      ? sql`${init instanceof SQLCaseWhen ? init.cases : init}`
      : sql<T>`CASE`;
  }

  when<Then>(whenExpr: SQLExpression, thenExpr: SQLExpression<Then>) {
    this.cases.append(sql` WHEN ${whenExpr} THEN ${thenExpr}`);
    return this as SQLCaseWhen<T | Then>;
  }

  else<Else>(elseExpr: SQLExpression<Else>) {
    return sql`${this.cases} ELSE ${elseExpr} END` as SQL<T | Else>;
  }

  elseNull() {
    return sql`${this.cases} END` as SQL<T | null>;
  }
}

export function caseWhen<Then>(
  whenExpr: SQLExpression,
  thenExpr: SQLExpression<Then>
) {
  return new SQLCaseWhen().when(whenExpr, thenExpr);
}