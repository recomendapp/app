import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { EnvService } from '@libs/env';
import { InternalImportsGuard } from './internal-imports.guard';

describe('InternalImportsGuard', () => {
  const fakeEnv = { API_INTERNAL_IMPORTS_SECRET: 'test-secret' } as EnvService;

  function contextWithAuthHeader(authorization?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows the request when the bearer secret matches', () => {
    const guard = new InternalImportsGuard(fakeEnv);

    expect(guard.canActivate(contextWithAuthHeader('Bearer test-secret'))).toBe(true);
  });

  it('throws when there is no authorization header', () => {
    const guard = new InternalImportsGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the secret does not match', () => {
    const guard = new InternalImportsGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader('Bearer wrong-secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the header is missing the "Bearer " prefix', () => {
    const guard = new InternalImportsGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader('test-secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws on a case-sensitive mismatch', () => {
    const guard = new InternalImportsGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader('bearer test-secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws on trailing whitespace in the header', () => {
    const guard = new InternalImportsGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader('Bearer test-secret '))).toThrow(
      UnauthorizedException,
    );
  });
});
