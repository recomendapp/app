import { createHmac, timingSafeEqual } from 'crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Inject,
  type RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ENV_SERVICE, type EnvService } from '@libs/env';

const SIGNATURE_HEADER = 'x-apple-signature';
const SIGNATURE_PREFIX = 'hmacsha256=';
const HEX_PATTERN = /^[0-9a-f]+$/i;

// App Store Connect signs each delivery with HMAC-SHA256 over the raw request body,
// using the secret configured for the webhook -- sent as
// `x-apple-signature: hmacsha256=<hex>`. Requires `rawBody: true` on the Nest app
// (main.ts), the same mechanism AuthController relies on for Better Auth.
@Injectable()
export class AppStoreConnectGuard implements CanActivate {
  constructor(@Inject(ENV_SERVICE) private readonly env: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest<FastifyRequest>>();
    const header = request.headers[SIGNATURE_HEADER];
    const signature = Array.isArray(header) ? header[0] : header;

    if (!signature?.startsWith(SIGNATURE_PREFIX) || !request.rawBody) {
      throw new UnauthorizedException('Invalid App Store Connect webhook signature');
    }

    const provided = signature.slice(SIGNATURE_PREFIX.length);
    const expected = createHmac('sha256', this.env.APP_STORE_CONNECT_WEBHOOK_SECRET)
      .update(request.rawBody)
      .digest('hex');

    if (!HEX_PATTERN.test(provided) || provided.length !== expected.length) {
      throw new UnauthorizedException('Invalid App Store Connect webhook signature');
    }

    const isValid = timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
    if (!isValid) {
      throw new UnauthorizedException('Invalid App Store Connect webhook signature');
    }

    return true;
  }
}
