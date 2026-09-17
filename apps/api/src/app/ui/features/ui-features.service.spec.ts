import type { I18nService } from 'nestjs-i18n';
import { defaultSupportedLocale } from '@libs/i18n';
import { UiFeaturesService } from './ui-features.service';

describe('UiFeaturesService', () => {
  function fakeI18n() {
    return {
      t: jest.fn((key: string, options: { lang: string }) => `${key}:${options.lang}`),
    } as unknown as jest.Mocked<I18nService>;
  }

  it('lists all known features with a translated label and description', () => {
    const i18n = fakeI18n();
    const service = new UiFeaturesService(i18n);

    const result = service.listAll(defaultSupportedLocale);

    expect(result.map((f) => f.key)).toEqual([
      'tracking',
      'recos',
      'playlists',
      'feed',
      'bookmarks',
    ]);
    for (const feature of result) {
      expect(feature.label).toBe(`features.${feature.key}.label:${defaultSupportedLocale}`);
      expect(feature.description).toBe(
        `features.${feature.key}.description:${defaultSupportedLocale}`,
      );
    }
  });

  it('passes the requested locale through to translations', () => {
    const i18n = fakeI18n();
    const service = new UiFeaturesService(i18n);

    const [tracking] = service.listAll('fr-FR');

    expect(tracking.label).toBe('features.tracking.label:fr-FR');
    expect(i18n.t).toHaveBeenCalledWith('features.tracking.label', { lang: 'fr-FR' });
  });

  it('includes video (with webm) and poster asset paths for every feature', () => {
    const service = new UiFeaturesService(fakeI18n());

    const result = service.listAll(defaultSupportedLocale);

    for (const feature of result) {
      expect(feature.video.default).toBeTruthy();
      expect(feature.video.mobile).toBeTruthy();
      expect(feature.video.webm).toBeTruthy();
      expect(feature.poster.default).toBeTruthy();
      expect(feature.poster.mobile).toBeTruthy();
    }
  });
});
