import { describe, it, expect, mock } from 'bun:test';
import { type ExecutionContext, Global, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';

const verifyAccessTokenRequest = mock();
const ENV_SERVICE = 'ENV_SERVICE';

mock.module('better-auth/oauth2', () => ({ verifyAccessTokenRequest }));
mock.module('better-auth/node', () => ({ fromNodeHeaders: mock() }));
mock.module('@libs/db/schemas', () => ({ user: { id: 'user.id' } }));
mock.module('drizzle-orm', () => ({ eq: mock() }));
mock.module('@libs/env', () => ({ ENV_SERVICE }));
mock.module('../../common/modules/drizzle/drizzle.module', () => ({
  DRIZZLE_SERVICE: 'DRIZZLE_SERVICE',
}));
mock.module('@shared/notify', () => ({ NotifySharedModule: class {} }));
mock.module('@shared/worker', () => ({ SharedWorkerModule: class {} }));
mock.module('./auth.controller', () => ({ AuthController: class {} }));
mock.module('./session-cleanup.service', () => ({ SessionCleanupService: class {} }));
mock.module('./auth.service', () => ({
  AUTH_SERVICE: 'AUTH_SERVICE',
  AuthProvider: { provide: 'AUTH_SERVICE', useValue: {} },
}));

const { DRIZZLE_SERVICE } = await import('../../common/modules/drizzle/drizzle.module');
const { AuthModule } = await import('./auth.module');
const { McpBearerAuthGuard } = await import('./guards');

describe('AuthModule MCP guard registration', () => {
  it('resolves McpBearerAuthGuard as MCP does and injects inherited dependencies', async () => {
    const findFirst = mock().mockResolvedValue({ id: 'user-1' });
    @Global()
    @Module({
      providers: [
        { provide: ENV_SERVICE, useValue: { API_URL: 'https://api.example.com' } },
        { provide: DRIZZLE_SERVICE, useValue: { query: { user: { findFirst } } } },
      ],
      exports: [ENV_SERVICE, DRIZZLE_SERVICE],
    })
    class DependenciesModule {}

    const module = await Test.createTestingModule({
      imports: [DependenciesModule, AuthModule],
    }).compile();

    try {
      const moduleRef = module.get(ModuleRef);
      verifyAccessTokenRequest.mockResolvedValue({ sub: 'user-1' });
      const guard = moduleRef.get(McpBearerAuthGuard, { strict: false });
      const request = {
        headers: { authorization: 'Bearer token' },
        method: 'POST',
        url: '/mcp',
        raw: {},
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({ header: mock() }),
        }),
      } as unknown as ExecutionContext;
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(request).toHaveProperty('user', { id: 'user-1' });
    } finally {
      await module.close();
    }
  });
});
