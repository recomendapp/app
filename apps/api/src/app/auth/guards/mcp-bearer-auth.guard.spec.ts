import { ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { verifyAccessTokenRequest } from 'better-auth/oauth2';
import { eq } from 'drizzle-orm';
import { user } from '@libs/db/schemas';
import type { EnvService } from '@libs/env';
import type { DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { McpBearerAuthGuard } from './mcp-bearer-auth.guard';

jest.mock('better-auth/oauth2', () => ({ verifyAccessTokenRequest: jest.fn() }));
jest.mock('@libs/db/schemas', () => ({ user: { id: 'user.id' } }));
jest.mock('@libs/env', () => ({ ENV_SERVICE: 'ENV_SERVICE' }));
jest.mock('../../../common/modules/drizzle/drizzle.module', () => ({
  DRIZZLE_SERVICE: 'DRIZZLE_SERVICE',
}));
jest.mock('drizzle-orm', () => ({ eq: jest.fn(() => 'user-id-filter') }));

describe('McpBearerAuthGuard', () => {
  const verify = jest.mocked(verifyAccessTokenRequest);
  const findFirst = jest.fn();
  const env = { API_URL: 'https://api.example.com', PORT: 9000 } as EnvService;

  beforeEach(() => {
    jest.clearAllMocks();
    verify.mockResolvedValue({ sub: 'user-1' });
    findFirst.mockReset().mockResolvedValue({ id: 'user-1' });
  });

  function setup(headers: Record<string, string | string[]> = { authorization: 'Bearer token' }) {
    const request: Record<string, unknown> = { headers, method: 'POST', url: '/mcp', raw: {} };
    const header = jest.fn();
    const reply = { header };
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => reply }),
    } as unknown as ExecutionContext;
    const db = { query: { user: { findFirst } } } as unknown as DrizzleService;
    return { request, context, header, guard: new McpBearerAuthGuard(db, env) };
  }

  it('validates the MCP audience and issuer before attaching the database user', async () => {
    const { request, context, guard } = setup();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith(
      {
        authorizationHeader: 'Bearer token',
        method: 'POST',
        url: 'https://api.example.com/mcp',
        dpopProofJwt: null,
      },
      {
        verifyOptions: { issuer: env.API_URL, audience: 'https://api.example.com/mcp' },
        jwksUrl: 'http://127.0.0.1:9000/auth/jwks',
      },
    );
    expect(eq).toHaveBeenCalledWith(user.id, 'user-1');
    expect(findFirst).toHaveBeenCalledWith({ where: 'user-id-filter', columns: { id: true } });
    expect(request.user).toEqual({ id: 'user-1' });
    expect((request.raw as { user?: unknown }).user).toEqual({ id: 'user-1' });
    expect(request).not.toHaveProperty('session');
  });

  it.each(['proof', ['proof', 'other-proof']])(
    'forwards the first DPoP proof (%j)',
    async (dpop) => {
      const { context, guard } = setup({ authorization: 'DPoP token', dpop });
      await guard.canActivate(context);
      expect(verify).toHaveBeenCalledWith(
        expect.objectContaining({ authorizationHeader: 'DPoP token', dpopProofJwt: 'proof' }),
        expect.anything(),
      );
    },
  );

  it.each([{}, { authorization: 'Bearer invalid-token' }])(
    'rejects credentials refused by the verifier (%j)',
    async (headers) => {
      const { request, context, header, guard } = setup(headers);
      verify.mockRejectedValue(new Error('Token verification failed'));
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(verify).toHaveBeenCalledWith(
        expect.objectContaining({ authorizationHeader: headers.authorization ?? null }),
        expect.anything(),
      );
      expect(findFirst).not.toHaveBeenCalled();
      expect(request).not.toHaveProperty('user');
      expect(header).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Bearer resource_metadata="https://api.example.com/.well-known/oauth-protected-resource/mcp"',
      );
    },
  );

  it('logs verification failures that are not token rejections', async () => {
    const { context, guard } = setup();
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const failure = new Error('Jwks failed: Forbidden');
    verify.mockRejectedValue(failure);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(logError).toHaveBeenCalledWith('MCP access token verification failed', failure);
  });

  it('does not log expected token rejections', async () => {
    const { context, guard } = setup();
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const rejection = Object.assign(new Error('invalid access token'), { name: 'APIError' });
    verify.mockRejectedValue(rejection);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(logError).not.toHaveBeenCalled();
  });

  it.each([undefined, ''])('rejects claims without a usable subject (%j)', async (sub) => {
    const { request, context, header, guard } = setup();
    verify.mockResolvedValue({ sub });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findFirst).not.toHaveBeenCalled();
    expect(request).not.toHaveProperty('user');
    expect(header).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Bearer'));
  });

  it('rejects a verified token whose user no longer exists', async () => {
    const { request, context, header, guard } = setup();
    findFirst.mockResolvedValue(undefined);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request).not.toHaveProperty('user');
    expect(header).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Bearer'));
  });

  it('propagates database failures without authenticating the request', async () => {
    const { request, context, header, guard } = setup();
    const error = new Error('Database unavailable');
    findFirst.mockRejectedValue(error);
    await expect(guard.canActivate(context)).rejects.toBe(error);
    expect(request).not.toHaveProperty('user');
    expect(header).not.toHaveBeenCalled();
  });
});
