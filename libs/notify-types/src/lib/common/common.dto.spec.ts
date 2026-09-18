import { LangSchema } from './common.dto';

describe('LangSchema', () => {
  it('defaults lang to en-US when omitted', () => {
    expect(LangSchema.parse({})).toEqual({ lang: 'en-US' });
  });

  it('accepts any supported locale', () => {
    expect(LangSchema.parse({ lang: 'fr-FR' })).toEqual({ lang: 'fr-FR' });
  });

  it('rejects an unsupported locale', () => {
    expect(LangSchema.safeParse({ lang: 'xx-XX' }).success).toBe(false);
  });
});
