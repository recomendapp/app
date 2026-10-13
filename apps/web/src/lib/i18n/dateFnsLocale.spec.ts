import { describe, it, expect } from 'bun:test';
import { supportedLocales } from '@libs/i18n';
import { loadDateFnsLocale } from './dateFnsLocale';

describe('loadDateFnsLocale', () => {
  it('resolves a date-fns locale for every supported locale', async () => {
    for (const locale of supportedLocales) {
      const dateFnsLocale = await loadDateFnsLocale(locale);

      expect(dateFnsLocale.code).toBeString();
      expect(dateFnsLocale.localize?.month(0)).toBeString();
    }
  });

  it('keeps the exact tag when date-fns ships it', async () => {
    expect((await loadDateFnsLocale('pt-BR')).code).toBe('pt-BR');
    expect((await loadDateFnsLocale('zh-HK')).code).toBe('zh-HK');
    expect((await loadDateFnsLocale('fr-CA')).code).toBe('fr-CA');
  });

  it('falls back to the language when date-fns has no regional variant', async () => {
    expect((await loadDateFnsLocale('de-DE')).code).toBe('de');
    expect((await loadDateFnsLocale('es-MX')).code).toBe('es');
    expect((await loadDateFnsLocale('pt-PT')).code).toBe('pt');
  });

  it('maps no-NO to Bokmål, the macrolanguage date-fns does not ship', async () => {
    expect((await loadDateFnsLocale('no-NO')).code).toBe('nb');
  });

  it('starts the week where the locale expects it', async () => {
    expect((await loadDateFnsLocale('en-US')).options?.weekStartsOn).toBe(0);
    expect((await loadDateFnsLocale('de-DE')).options?.weekStartsOn).toBe(1);
  });
});
