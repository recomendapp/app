import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupportedLocale, supportedLocales, defaultSupportedLocale } from '@libs/i18n';

export const CurrentLocale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SupportedLocale => {
    const request = ctx.switchToHttp().getRequest();
    let locale = request.headers['x-language'];
  
    if (!locale && request.headers['accept-language']) {
      locale = request.headers['accept-language'].split(',')[0]; 
    }

    if (locale && supportedLocales.includes(locale)) {
      return locale;
    }
    return defaultSupportedLocale;
  },
);
