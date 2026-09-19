import type { ExecutionContext } from '@nestjs/common';
import type { AuthService } from '../auth.service';

jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn((h) => h) }));
jest.mock('../auth.service', () => ({ AUTH_SERVICE: 'AUTH_SERVICE' }));

const { OptionalAuthGuard } =
  require('./optional-auth.guard') as typeof import('./optional-auth.guard');

describe('OptionalAuthGuard', () => {
  const session = { session: { id: 'session-1' }, user: { id: 'user-1' } };

  function fakeAuth(getSession: jest.Mock) {
    return { api: { getSession } } as unknown as AuthService;
  }

  function httpContext(request: Record<string, unknown>): ExecutionContext {
    return {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  function wsContext(client: Record<string, unknown>): ExecutionContext {
    return {
      getType: () => 'ws',
      switchToWs: () => ({ getClient: () => client }),
    } as unknown as ExecutionContext;
  }

  it('attaches user/session when one exists', async () => {
    const getSession = jest.fn().mockResolvedValue(session);
    const guard = new OptionalAuthGuard(fakeAuth(getSession));
    const request: Record<string, unknown> = { headers: {} };

    const result = await guard.canActivate(httpContext(request));

    expect(result).toBe(true);
    expect(request.user).toEqual(session.user);
    expect(request.session).toEqual(session.session);
  });

  it('never throws and sets user/session to null when there is no session (http)', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const guard = new OptionalAuthGuard(fakeAuth(getSession));
    const request: Record<string, unknown> = { headers: {} };

    const result = await guard.canActivate(httpContext(request));

    expect(result).toBe(true);
    expect(request.user).toBeNull();
    expect(request.session).toBeNull();
  });

  it('never throws and sets user/session to null when there is no session (ws)', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const guard = new OptionalAuthGuard(fakeAuth(getSession));
    const client: Record<string, unknown> = { handshake: { headers: {} } };

    const result = await guard.canActivate(wsContext(client));

    expect(result).toBe(true);
    expect(client.user).toBeNull();
    expect(client.session).toBeNull();
  });

  it('treats an undefined getSession result the same as null', async () => {
    const getSession = jest.fn().mockResolvedValue(undefined);
    const guard = new OptionalAuthGuard(fakeAuth(getSession));
    const request: Record<string, unknown> = { headers: {} };

    await guard.canActivate(httpContext(request));

    expect(request.user).toBeNull();
    expect(request.session).toBeNull();
  });
});
