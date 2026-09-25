import { ExecutionContext, Global, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { verifyAccessTokenRequest } from 'better-auth/oauth2';
import { ENV_SERVICE } from '@libs/env';
import { DRIZZLE_SERVICE } from '../../common/modules/drizzle/drizzle.module';
import { AuthModule } from './auth.module';
import { McpBearerAuthGuard } from './guards';

jest.mock('better-auth/oauth2', () => ({ verifyAccessTokenRequest: jest.fn() }));
jest.mock('better-auth/node', () => ({ fromNodeHeaders: jest.fn() }));
jest.mock('@libs/db/schemas', () => ({ user: { id: 'user.id' } }));
jest.mock('drizzle-orm', () => ({ eq: jest.fn() }));
jest.mock('@libs/env', () => ({ ENV_SERVICE: 'ENV_SERVICE' }));
jest.mock('../../common/modules/drizzle/drizzle.module', () => ({
  DRIZZLE_SERVICE: 'DRIZZLE_SERVICE',
}));
jest.mock('@shared/notify', () => ({ NotifySharedModule: class {} }));
jest.mock('@shared/worker', () => ({ SharedWorkerModule: class {} }));
jest.mock('./auth.controller', () => ({ AuthController: class {} }));
jest.mock('./session-cleanup.service', () => ({ SessionCleanupService: class {} }));
jest.mock('./auth.service', () => ({
  AUTH_SERVICE: 'AUTH_SERVICE',
  AuthProvider: { provide: 'AUTH_SERVICE', useValue: {} },
}));

describe('AuthModule MCP guard registration', () => {
  it('resolves McpBearerAuthGuard as MCP does and injects inherited dependencies', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'user-1' });
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
      jest.mocked(verifyAccessTokenRequest).mockResolvedValue({ sub: 'user-1' });
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
          getResponse: () => ({ header: jest.fn() }),
        }),
      } as unknown as ExecutionContext;
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(request).toHaveProperty('user', { id: 'user-1' });
    } finally {
      await module.close();
    }
  });
});
