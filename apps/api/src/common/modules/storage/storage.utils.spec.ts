import { getMediaUrl } from './storage.utils';

describe('getMediaUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      S3_PUBLIC_ENDPOINT: 'https://cdn.test',
      S3_BUCKET: 'my-bucket',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns null for a null filename', () => {
    expect(getMediaUrl(null, 'avatars')).toBeNull();
  });

  it('returns null for an undefined filename', () => {
    expect(getMediaUrl(undefined, 'avatars')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getMediaUrl('', 'avatars')).toBeNull();
  });

  it('passes an absolute http URL through unchanged', () => {
    expect(getMediaUrl('http://example.com/a.png', 'avatars')).toBe('http://example.com/a.png');
  });

  it('passes an absolute https URL through unchanged', () => {
    expect(getMediaUrl('https://example.com/a.png', 'avatars')).toBe('https://example.com/a.png');
  });

  it('builds a full URL from a bare filename using the public endpoint, bucket and folder', () => {
    expect(getMediaUrl('avatar.png', 'avatars')).toBe(
      'https://cdn.test/my-bucket/avatars/avatar.png',
    );
  });

  it('falls back to S3_ENDPOINT when S3_PUBLIC_ENDPOINT is not set', () => {
    delete process.env.S3_PUBLIC_ENDPOINT;
    process.env.S3_ENDPOINT = 'https://internal.test';

    expect(getMediaUrl('avatar.png', 'avatars')).toBe(
      'https://internal.test/my-bucket/avatars/avatar.png',
    );
  });

  it('falls back to the "medias" bucket when S3_BUCKET is not set', () => {
    delete process.env.S3_BUCKET;

    expect(getMediaUrl('avatar.png', 'avatars')).toBe('https://cdn.test/medias/avatars/avatar.png');
  });
});
