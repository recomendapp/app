import { Module } from '@nestjs/common';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { defaultSupportedLocale, HEADER_LANGUAGE_KEY, SupportedLocale } from '@libs/i18n';
import { UiFeaturesController } from './ui-features.controller';
import { UiFeaturesService } from './ui-features.service';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: defaultSupportedLocale,
      fallbacks: {
        'en-*': 'en-US' as SupportedLocale,
        'fr-*': 'fr-FR' as SupportedLocale,
      },
      loaderOptions: {
        path: path.join(__dirname, '/assets/i18n/'),
        watch: true,
      },
      resolvers: [{ use: HeaderResolver, options: [HEADER_LANGUAGE_KEY] }],
    }),
  ],
  controllers: [UiFeaturesController],
  providers: [UiFeaturesService],
})
export class UiFeaturesModule {}
