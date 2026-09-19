import { assetUrl } from './asset-url';

describe('assetUrl', () => {
  it('joins a base url and asset path with a single slash', () => {
    expect(assetUrl('app/icon.png', 'https://assets.example.com')).toBe(
      'https://assets.example.com/app/icon.png',
    );
  });

  it('strips a trailing slash from the base url before joining', () => {
    expect(assetUrl('app/icon.png', 'https://assets.example.com/')).toBe(
      'https://assets.example.com/app/icon.png',
    );
  });

  it('only strips one trailing slash, not repeated ones', () => {
    expect(assetUrl('app/icon.png', 'https://assets.example.com//')).toBe(
      'https://assets.example.com//app/icon.png',
    );
  });

  it('preserves a base url with a sub-path', () => {
    expect(assetUrl('app/icon.png', 'https://cdn.example.com/static')).toBe(
      'https://cdn.example.com/static/app/icon.png',
    );
  });
});
