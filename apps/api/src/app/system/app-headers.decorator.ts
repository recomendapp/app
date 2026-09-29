import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { readAppVersionHeaders, type AppPlatform } from '@libs/rules';

export const AppHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { platform: AppPlatform; version: string } | null => {
    const request = ctx.switchToHttp().getRequest();
    return readAppVersionHeaders(request.headers);
  },
);
