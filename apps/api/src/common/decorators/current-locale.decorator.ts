import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupportedLocale, getLocaleFromHeaders } from '@libs/i18n';

export const CurrentLocale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SupportedLocale => {
    const request = ctx.switchToHttp().getRequest();
    return getLocaleFromHeaders(request.headers);
  },
);
