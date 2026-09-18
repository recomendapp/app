import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { baseCursorSchema, decodeCursor, encodeCursor } from './cursor';

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a payload through encode then decode', () => {
    const payload = { value: 'foo', id: 42 };

    const cursor = encodeCursor(payload);
    const result = decodeCursor<typeof payload>(cursor);

    expect(result).toEqual(payload);
  });

  it('produces a base64 string', () => {
    const cursor = encodeCursor({ value: 1 });

    expect(() => Buffer.from(cursor, 'base64')).not.toThrow();
    expect(cursor).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('throws BadRequestException for a non-base64/non-JSON cursor', () => {
    expect(() => decodeCursor('%%%not-valid-base64%%%')).toThrow(BadRequestException);
  });

  it('throws BadRequestException when the decoded payload does not match the schema', () => {
    const cursor = encodeCursor({ value: 'foo' }); // missing `id`
    const schema = baseCursorSchema(z.string(), z.number());

    expect(() => decodeCursor(cursor, schema)).toThrow(BadRequestException);
  });

  it('passes through an unvalidated but well-shaped cursor when no schema is given', () => {
    const cursor = encodeCursor({ anything: 'goes' });

    const result = decodeCursor<{ anything: string }>(cursor);

    expect(result).toEqual({ anything: 'goes' });
  });

  it('accepts a cursor that matches the schema', () => {
    const schema = baseCursorSchema(z.number(), z.string());
    const cursor = encodeCursor({ value: 5, id: 'abc' });

    const result = decodeCursor(cursor, schema);

    expect(result).toEqual({ value: 5, id: 'abc' });
  });

  it('rejects a well-formed base64 string whose content is not valid JSON', () => {
    const notJson = Buffer.from('not json at all').toString('base64');

    expect(() => decodeCursor(notJson)).toThrow(BadRequestException);
  });

  it('rejects a cursor decoded from a completely different (but valid) JSON shape via the schema', () => {
    const cursor = encodeCursor({ foo: 'bar' });
    const schema = baseCursorSchema(z.string(), z.number());

    expect(() => decodeCursor(cursor, schema)).toThrow(BadRequestException);
  });
});
