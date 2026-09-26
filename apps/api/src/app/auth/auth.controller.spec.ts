import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AUTH_SERVICE } from './auth.service';

jest.mock('./auth.service', () => ({ AUTH_SERVICE: 'AUTH_SERVICE' }));

describe('Better Auth HTTP routes', () => {
  let app: NestFastifyApplication;
  const handler = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AUTH_SERVICE, useValue: { handler } }],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
      rawBody: true,
    });
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    handler.mockReset();
  });

  it.each([
    '/.well-known/oauth-authorization-server',
    '/.well-known/oauth-authorization-server/auth',
    '/.well-known/oauth-protected-resource',
    '/.well-known/oauth-protected-resource/mcp',
    '/.well-known/openid-configuration',
    '/auth/jwks',
    '/auth/oauth2/authorize?client_id=test&response_type=code',
  ])('forwards %s to Better Auth without changing the URL', async (url) => {
    handler.mockResolvedValue(
      Response.json(
        { issuer: 'http://localhost:9000' },
        {
          headers: { 'cache-control': 'public, max-age=60' },
        },
      ),
    );
    const response = await app.inject({ method: 'GET', url, headers: { host: 'localhost:9000' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ issuer: 'http://localhost:9000' });
    expect(response.headers['cache-control']).toBe('public, max-age=60');
    const request = handler.mock.calls[0][0] as Request;
    expect(request.url).toBe(`http://localhost:9000${url}`);
    expect(request.method).toBe('GET');
  });

  it('preserves existing auth POST bodies, cookies and redirects', async () => {
    handler.mockResolvedValue(
      new Response(null, { status: 302, headers: { location: '/auth/login' } }),
    );
    const response = await app.inject({
      method: 'POST',
      url: '/auth/sign-in/email',
      headers: { cookie: 'session=test' },
      payload: { email: 'user@example.com', password: 'test' },
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/auth/login');
    const request = handler.mock.calls[0][0] as Request;
    expect(request.headers.get('cookie')).toBe('session=test');
    expect(await request.json()).toEqual({ email: 'user@example.com', password: 'test' });
  });

  it('forwards form-encoded OAuth token requests as form data', async () => {
    handler.mockResolvedValue(Response.json({ access_token: 'token' }));
    await app.inject({
      method: 'POST',
      url: '/auth/oauth2/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'grant_type=authorization_code&code=abc&resource=a&resource=b',
    });
    const request = handler.mock.calls[0][0] as Request;
    const form = await request.formData();
    expect(form.get('grant_type')).toBe('authorization_code');
    expect(form.get('code')).toBe('abc');
    expect(form.getAll('resource')).toEqual(['a', 'b']);
  });

  it('does not capture unrelated routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/.well-known/unrelated' });
    expect(response.statusCode).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });
});
