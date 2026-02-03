import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, OptionalAuthenticatedRequest } from '../types/fastify';

export const CurrentSession = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.session;
});

export const CurrentOptionalSession = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<OptionalAuthenticatedRequest>();
  return request.session;
});
