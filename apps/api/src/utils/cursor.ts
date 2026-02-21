
export interface BaseCursor<TValue = any, TId = string | number> {
  value: TValue;
  id: TId;
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
 * Decodes a base64-encoded cursor string back into its original object form.
 * If the input is invalid or cannot be parsed, it returns null and logs a warning.
 * @param cursor The base64-encoded cursor string to decode.
 * @returns The decoded object of type T, or null if decoding fails.
 */
export function decodeCursor<T>(cursor?: string | null): T | null {
  if (!cursor) return null;

  try {
    const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decodedString) as T;
  } catch (error) {
    console.warn('Invalid cursor payload received', error);
    return null;
  }
}