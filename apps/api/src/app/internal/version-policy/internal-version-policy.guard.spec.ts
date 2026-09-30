import { describe, it, expect } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { EnvService } from '@libs/env';
import { InternalVersionPolicyGuard } from './internal-version-policy.guard';

describe('InternalVersionPolicyGuard', () => {
  const fakeEnv = { API_INTERNAL_VERSION_POLICY_SECRET: 'test-secret' } as EnvService;

  function contextWithAuthHeader(authorization?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows the request when the bearer secret matches', () => {
    const guard = new InternalVersionPolicyGuard(fakeEnv);

    expect(guard.canActivate(contextWithAuthHeader('Bearer test-secret'))).toBe(true);
  });

  it('throws when there is no authorization header', () => {
    const guard = new InternalVersionPolicyGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the secret does not match', () => {
    const guard = new InternalVersionPolicyGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader('Bearer wrong-secret'))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the header is missing the "Bearer " prefix', () => {
    const guard = new InternalVersionPolicyGuard(fakeEnv);

    expect(() => guard.canActivate(contextWithAuthHeader('test-secret'))).toThrow(
      UnauthorizedException,
    );
  });
});
