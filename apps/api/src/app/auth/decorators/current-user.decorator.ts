import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, OptionalAuthenticatedRequest } from '../types/fastify';

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});

export const CurrentOptionalUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<OptionalAuthenticatedRequest>();
  return request.user;
});
