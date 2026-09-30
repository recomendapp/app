import { createHmac } from 'crypto';
import { describe, it, expect } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { EnvService } from '@libs/env';
import { AppStoreConnectGuard } from './webhook-app-store-connect.guard';

describe('AppStoreConnectGuard', () => {
  const secret = 'test-secret';
  const fakeEnv = { APP_STORE_CONNECT_WEBHOOK_SECRET: secret } as EnvService;
  const body = Buffer.from(JSON.stringify({ data: { type: 'webhookPingCreated' } }));

  const sign = (buf: Buffer) => createHmac('sha256', secret).update(buf).digest('hex');

  function contextWithRequest(
    signature: string | undefined,
    rawBody: Buffer | undefined,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-apple-signature': signature },
          rawBody,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows the request when the HMAC-SHA256 signature matches', () => {
    const guard = new AppStoreConnectGuard(fakeEnv);
    const signature = `hmacsha256=${sign(body)}`;

    expect(guard.canActivate(contextWithRequest(signature, body))).toBe(true);
  });

  it('throws when there is no signature header', () => {
    const guard = new AppStoreConnectGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithRequest(undefined, body))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the signature is missing the "hmacsha256=" prefix', () => {
    const guard = new AppStoreConnectGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithRequest(sign(body), body))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when there is no raw body to verify against', () => {
    const guard = new AppStoreConnectGuard(fakeEnv);
    const signature = `hmacsha256=${sign(body)}`;

    expect(() => guard.canActivate(contextWithRequest(signature, undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the signature does not match the body', () => {
    const guard = new AppStoreConnectGuard(fakeEnv);
    const signature = `hmacsha256=${sign(Buffer.from('tampered'))}`;

    expect(() => guard.canActivate(contextWithRequest(signature, body))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the signature is not valid hex', () => {
    const guard = new AppStoreConnectGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithRequest('hmacsha256=not-hex!!', body))).toThrow(
      UnauthorizedException,
    );
  });
});
