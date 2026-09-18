import { getDictionary } from './getDictionary';

describe('getDictionary (web/dynamic-import variant)', () => {
  it('loads the fr-FR dictionary for fr-FR', async () => {
    const dict = await getDictionary('fr-FR');
    expect(dict).toBeTruthy();
  });

  it('loads the en-US dictionary for en-US', async () => {
    const dict = await getDictionary('en-US');
    expect(dict).toBeTruthy();
  });

  it('falls back to the en-US dictionary for an unrecognized locale', async () => {
    const fallback = await getDictionary('xx-XX' as any);
    const enUs = await getDictionary('en-US');
    expect(fallback).toEqual(enUs);
  });

  it('returns different content for fr-FR and en-US', async () => {
    const fr = await getDictionary('fr-FR');
    const en = await getDictionary('en-US');
    expect(fr).not.toEqual(en);
  });
});
