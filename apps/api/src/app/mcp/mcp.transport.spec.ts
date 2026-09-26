import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { McpStrategy } from '@rekog/mcp-nest';
import { verifyAccessTokenRequest } from 'better-auth/oauth2';
import { ENV_SERVICE } from '@libs/env';
import { DRIZZLE_SERVICE } from '../../common/modules/drizzle/drizzle.module';
import { McpModule } from './mcp.module';
import { MoviesTool } from '../movies/movies.tool';
import { MoviesService } from '../movies/movies.service';
import { MeTool } from '../me/me.tool';
import { MeService } from '../me/me.service';
import { McpBearerAuthGuard } from '../auth/guards';

jest.mock('better-auth/oauth2', () => ({ verifyAccessTokenRequest: jest.fn() }));
jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn() }));
jest.mock('@libs/db/schemas', () => ({ user: { id: 'user.id' } }));
jest.mock('drizzle-orm', () => ({ eq: jest.fn() }));
jest.mock('@libs/env', () => ({ ENV_SERVICE: 'ENV_SERVICE' }));
jest.mock('../../common/modules/drizzle/drizzle.module', () => ({
  DRIZZLE_SERVICE: 'DRIZZLE_SERVICE',
}));
jest.mock('../auth/auth.service', () => ({ AUTH_SERVICE: 'AUTH_SERVICE' }));
jest.mock('../movies/movies.service', () => ({ MoviesService: class {} }));
jest.mock('../me/me.service', () => ({ MeService: class {} }));

describe('MCP HTTP transport', () => {
  let app: NestFastifyApplication;
  let baseUrl: string;
  const getMovie = jest.fn().mockResolvedValue({ id: 157336 });
  const getMe = jest.fn().mockResolvedValue({ id: 'user-1' });

  beforeAll(async () => {
    @Global()
    @Module({
      providers: [
        McpBearerAuthGuard,
        { provide: ENV_SERVICE, useValue: { API_URL: 'http://localhost:9000' } },
        {
          provide: DRIZZLE_SERVICE,
          useValue: {
            query: { user: { findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }) } },
          },
        },
      ],
      exports: [McpBearerAuthGuard, ENV_SERVICE, DRIZZLE_SERVICE],
    })
    class DependenciesModule {}

    const module = await Test.createTestingModule({
      imports: [DependenciesModule, McpModule],
      controllers: [MoviesTool, MeTool],
      providers: [
        { provide: MoviesService, useValue: { get: getMovie } },
        { provide: MeService, useValue: { get: getMe } },
      ],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
      logger: false,
    });
    const mcp = app.get(McpStrategy);
    mcp.setHttpAdapter(app.getHttpAdapter());
    app.connectMicroservice({ strategy: mcp });
    await app.startAllMicroservices();
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(verifyAccessTokenRequest).mockResolvedValue({ sub: 'user-1' });
  });

  async function call(method: string, params: Record<string, unknown>, authorization?: string) {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'accept-language': 'fr-FR',
        ...(params._meta
          ? {
              'mcp-protocol-version': '2026-07-28',
              'mcp-method': method,
              ...(typeof params.name === 'string' ? { 'mcp-name': params.name } : {}),
            }
          : {}),
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const body = await response.json();
    return {
      statusCode: response.status,
      wwwAuthenticate: response.headers.get('www-authenticate') ?? undefined,
      headers: { 'mcp-session-id': response.headers.get('mcp-session-id') ?? undefined },
      json: () => body,
    };
  }

  it('rejects an unauthenticated request with a 401 and WWW-Authenticate challenge', async () => {
    jest.mocked(verifyAccessTokenRequest).mockRejectedValue(new Error('Missing token'));
    const response = await call('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test', version: '1' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.wwwAuthenticate).toBe(
      'Bearer resource_metadata="http://localhost:9000/.well-known/oauth-protected-resource/mcp"',
    );
  });

  it('rejects an invalid bearer token with a 401', async () => {
    jest.mocked(verifyAccessTokenRequest).mockRejectedValue(new Error('Invalid token'));
    const response = await call(
      'tools/call',
      { name: 'get-movie', arguments: { movieId: 157336 } },
      'Bearer invalid',
    );
    expect(response.statusCode).toBe(401);
    expect(getMovie).not.toHaveBeenCalled();
  });

  it('initializes legacy clients without creating a session', async () => {
    const response = await call(
      'initialize',
      {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'test', version: '1' },
      },
      'Bearer token',
    );
    expect(response.statusCode).toBe(200);
    expect(response.json().result.serverInfo.name).toBe('recomend-mcp-server');
    expect(response.headers['mcp-session-id']).toBeUndefined();
  });

  it('advertises both tools once authenticated', async () => {
    const response = await call('tools/list', {}, 'Bearer token');
    expect(response.json().result.tools.map((tool: { name: string }) => tool.name)).toEqual(
      expect.arrayContaining(['get-movie', 'whoami']),
    );
  });

  it('serves modern discovery and tool calls without initialization, once authenticated', async () => {
    const meta = {
      'io.modelcontextprotocol/protocolVersion': '2026-07-28',
      'io.modelcontextprotocol/clientCapabilities': {},
      'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1' },
    };
    for (const [method, params] of [
      ['server/discover', {}],
      ['tools/call', { name: 'get-movie', arguments: { movieId: 157336 } }],
    ] as const) {
      const response = await call(method, { ...params, _meta: meta }, 'Bearer token');
      expect({ status: response.statusCode, error: response.json().error }).toEqual({
        status: 200,
        error: undefined,
      });
      expect(response.headers['mcp-session-id']).toBeUndefined();
    }
    expect(getMovie).toHaveBeenCalledWith(
      expect.objectContaining({ movieId: 157336, currentUser: { id: 'user-1' } }),
    );
    const authenticated = await call(
      'tools/call',
      {
        name: 'whoami',
        arguments: {},
        _meta: meta,
      },
      'Bearer token',
    );
    expect(authenticated.statusCode).toBe(200);
    expect(getMe).toHaveBeenCalledWith({ id: 'user-1' });
  });

  it('calls get-movie once authenticated and forwards the locale and current user', async () => {
    const response = await call(
      'tools/call',
      { name: 'get-movie', arguments: { movieId: 157336 } },
      'Bearer token',
    );
    expect(response.json().result.isError).not.toBe(true);
    expect(getMovie).toHaveBeenCalledWith(
      expect.objectContaining({ movieId: 157336, currentUser: { id: 'user-1' }, locale: 'fr-FR' }),
    );
  });

  it('rejects a non-integer movie id before invoking the service', async () => {
    await call('tools/call', { name: 'get-movie', arguments: { movieId: 1.5 } }, 'Bearer token');
    expect(getMovie).not.toHaveBeenCalled();
  });

  it('passes the authenticated user from the guard to whoami', async () => {
    const response = await call('tools/call', { name: 'whoami', arguments: {} }, 'Bearer token');
    expect(response.json().result.isError).not.toBe(true);
    expect(getMe).toHaveBeenCalledWith({ id: 'user-1' });
  });
});
