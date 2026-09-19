import { createPrefixedRegistry } from './utils';

describe('createPrefixedRegistry', () => {
  it('prefixes every key with "prefix:"', () => {
    const result = createPrefixedRegistry('search', {
      'sync-user': 'schema-a',
      'sync-playlist': 'schema-b',
    });

    expect(result).toEqual({
      'search:sync-user': 'schema-a',
      'search:sync-playlist': 'schema-b',
    });
  });

  it('returns an empty object for an empty input', () => {
    expect(createPrefixedRegistry('search', {})).toEqual({});
  });

  it('does not mutate the input object', () => {
    const input = { 'sync-user': 'schema-a' };
    createPrefixedRegistry('search', input);
    expect(input).toEqual({ 'sync-user': 'schema-a' });
  });
});
