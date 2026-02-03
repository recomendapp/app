import { Controller, All, Req, Res, Inject } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AUTH_SERVICE, AuthService } from './auth.service';

@ApiExcludeController()
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
  ) {}

  @All('*')
  async handleAuth(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const url = new URL(
      req.raw.url || req.url,
      `${req.protocol}://${req.hostname}`,
    );

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    });

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const response = await this.auth.handler(request);

    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.header(key, value);
    });

    const body = response.body ? await response.json() : null;

    return res.send(body);
  }
}
