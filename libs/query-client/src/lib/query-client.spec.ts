import { queryClient } from './query-client';

describe('queryClient', () => {
  it('should work', () => {
    expect(queryClient()).toEqual('query-client');
  });
});
