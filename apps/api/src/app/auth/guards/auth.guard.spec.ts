import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { AuthService } from '../auth.service';

jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn((h) => h) }));
jest.mock('../auth.service', () => ({ AUTH_SERVICE: 'AUTH_SERVICE' }));

const { AuthGuard } = require('./auth.guard') as typeof import('./auth.guard');

describe('AuthGuard', () => {
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

  it('allows the request and attaches user/session when a session exists (http)', async () => {
    const getSession = jest.fn().mockResolvedValue(session);
    const guard = new AuthGuard(fakeAuth(getSession));
    const request: Record<string, unknown> = { headers: { cookie: 'a=b' } };

    const result = await guard.canActivate(httpContext(request));

    expect(result).toBe(true);
    expect(request.user).toEqual(session.user);
    expect(request.session).toEqual(session.session);
  });

  it('throws UnauthorizedException over http when there is no session', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const guard = new AuthGuard(fakeAuth(getSession));

    await expect(guard.canActivate(httpContext({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows the request and attaches user/session when a session exists (ws)', async () => {
    const getSession = jest.fn().mockResolvedValue(session);
    const guard = new AuthGuard(fakeAuth(getSession));
    const client: Record<string, unknown> = { handshake: { headers: {} } };

    const result = await guard.canActivate(wsContext(client));

    expect(result).toBe(true);
    expect(client.user).toEqual(session.user);
    expect(client.session).toEqual(session.session);
  });

  it('throws WsException (not UnauthorizedException) over ws when there is no session', async () => {
    const getSession = jest.fn().mockResolvedValue(null);
    const guard = new AuthGuard(fakeAuth(getSession));
    const client = { handshake: { headers: {} } };

    await expect(guard.canActivate(wsContext(client))).rejects.toBeInstanceOf(WsException);
  });
});
