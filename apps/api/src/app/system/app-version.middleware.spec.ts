import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Controller, Get, Global, Module, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { versionPolicy, systemConfig } from '@libs/db/schemas';
import { SystemModule } from './system.module';
import { DRIZZLE_SERVICE } from '../../common/modules/drizzle/drizzle.module';
import { CacheService } from '../../common/modules/cache/cache.service';

@Controller()
class PingController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}

const fakeCache = { get: async () => null, set: async () => undefined };

const policyRows = [
  { platform: 'ios', version: '2.0.0', isBreaking: true, state: 'live' },
  { platform: 'android', version: '2.0.0', isBreaking: true, state: 'live' },
  { platform: 'web', version: '3.0.0', isBreaking: true, state: 'live' },
];
const configRows = [{ key: 'is_maintenance', value: false }];

const fakeDb = {
  select: () => ({
    from: (table: unknown) => {
      if (table === versionPolicy) return { where: async () => policyRows };
      if (table === systemConfig) return { where: async () => configRows };
      throw new Error('Unexpected table passed to fakeDb.select().from()');
    },
  }),
};

// DRIZZLE_SERVICE and CacheService are real @Global() providers in the app;
// stand them in the same way for this isolated module test.
@Global()
@Module({
  providers: [
    { provide: DRIZZLE_SERVICE, useValue: fakeDb },
    { provide: CacheService, useValue: fakeCache },
  ],
  exports: [DRIZZLE_SERVICE, CacheService],
})
class FakeGlobalsModule {}

describe('AppVersionMiddleware', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FakeGlobalsModule, SystemModule],
      controllers: [PingController],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const outdated = { 'x-app-platform': 'ios', 'x-app-version': '1.9.0' };

  it('rejects an outdated app with 426 UPGRADE_REQUIRED', async () => {
    const res = await app.inject({ method: 'GET', url: '/ping', headers: outdated });
    expect(res.statusCode).toBe(426);
    expect(res.json()).toMatchObject({
      statusCode: 426,
      code: 'UPGRADE_REQUIRED',
      minVersion: '2.0.0',
    });
  });

  it('lets a supported app through', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { ...outdated, 'x-app-version': '2.0.0' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('ignores requests without app headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/ping' });
    expect(res.statusCode).toBe(200);
  });

  it('applies the same policy mechanism to the web platform', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { 'x-app-platform': 'web', 'x-app-version': '2.9.0' },
    });
    expect(res.statusCode).toBe(426);
    expect(res.json()).toMatchObject({ code: 'UPGRADE_REQUIRED', minVersion: '3.0.0' });
  });

  it('still serves its own status to an outdated app', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/status', headers: outdated });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ version: { status: string } }>().version.status).toBe('update_required');
  });

  it('serves a neutral status without app headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ version: { status: string } }>().version.status).toBe('up_to_date');
  });
});
