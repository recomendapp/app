import { Controller, All, Req, Res, Inject, RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AUTH_SERVICE, AuthService } from './auth.service';

@ApiExcludeController()
@Controller()
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly auth: AuthService) {}

  @All([
    'auth/*',
    '.well-known/oauth-authorization-server',
    '.well-known/oauth-authorization-server/*',
    '.well-known/oauth-protected-resource',
    '.well-known/oauth-protected-resource/*',
    '.well-known/openid-configuration',
  ])
  async handleAuth(@Req() req: RawBodyRequest<FastifyRequest>, @Res() res: FastifyReply) {
    const url = new URL(req.raw.url || req.url, `${req.protocol}://${req.host}`);

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    });

    // Forward the exact bytes received rather than re-serializing the parsed
    // body: Better Auth parses it itself according to the forwarded
    // content-type (JSON for sign-in, form-encoded for /auth/oauth2/token per
    // RFC 6749). Requires `rawBody: true` on the Nest app (main.ts).
    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.rawBody && new Uint8Array(req.rawBody),
    });

    const response = await this.auth.handler(request);

    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    if (!response.body) {
      return res.send();
    }

    const textBody = await response.text();
    return res.send(textBody);
  }
}
