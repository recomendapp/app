import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export interface BaseCursor<TValue = any, TId = string | number> {
  value: TValue;
  id: TId;
}

/**
 * Builds the zod schema for the most common cursor shape (`{ value, id }`)
 * to pass to `decodeCursor`, instead of every call site hand-rolling the
 * same `z.object({...})`.
 */
export function baseCursorSchema<TValue extends z.ZodTypeAny, TId extends z.ZodTypeAny>(
  value: TValue,
  id: TId,
) {
  return z.object({ value, id });
}

/**
 * Encodes a cursor object into a base64 string for use in pagination.
 * @param payload The cursor object containing the value and id to encode.
 * @returns A base64-encoded string representing the cursor.
 */
export function encodeCursor<T>(payload: T): string {
  const jsonString = JSON.stringify(payload);
  return Buffer.from(jsonString).toString('base64');
}

/**
 * Decodes a base64-encoded cursor string back into its original object
 * form. Without a `schema`, only checks that the payload is valid
 * base64-encoded JSON — the result is cast to `T`, not validated against
 * it, so a well-formed but wrong-shaped cursor (or one from a different
 * endpoint) passes through silently. Pass a `schema` to also validate the
 * decoded shape; callers that then index into the result (array access,
 * arithmetic, SQL comparisons) can otherwise turn a malformed cursor into
 * a confusing 500 or a silently wrong page instead of a clean 400.
 * @param cursor The base64-encoded cursor string to decode.
 * @param schema Optional zod schema the decoded payload must match.
 * @throws BadRequestException if the cursor cannot be decoded, or (when a
 * schema is passed) doesn't match it.
 */
export function decodeCursor<T>(cursor: string): T;
export function decodeCursor<T>(cursor: string, schema: z.ZodType<T>): T;
export function decodeCursor<T>(cursor: string, schema?: z.ZodType<T>): T {
  let parsed: unknown;
  try {
    const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
    parsed = JSON.parse(decodedString);
  } catch {
    throw new BadRequestException('Invalid cursor');
  }

  if (!schema) return parsed as T;

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new BadRequestException('Invalid cursor');
  }
  return result.data;
}
