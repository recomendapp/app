import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'http';
import { and, eq } from 'drizzle-orm';
import { systemConfig, versionPolicy } from '@libs/db/schemas';
import {
  compareAppVersions,
  evaluateAppVersionStatus,
  readAppVersionHeaders,
  APP_PLATFORMS,
  APP_VERSION_RULES,
  type AppPlatform,
  type AppVersionPolicy,
} from '@libs/rules';
import { DRIZZLE_SERVICE, type DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { CacheService } from '../../common/modules/cache/cache.service';
import { parseResponseDto } from '../../utils/parse-response-dto';
import { StatusDto } from './dto/status.dto';

const STATUS_CACHE_KEY = 'system:status-base';

// In-process cache in front of Redis: `AppVersionMiddleware` calls this on
// (almost) every request, and most of those don't need to leave the process
// at all. Short on purpose -- it only needs to outlive a handful of requests,
// not minimize Redis traffic at the cost of noticeably stale data.
const L1_CACHE_TTL_MS = 5_000;

type StatusBase = {
  isMaintenance: boolean;
  versionPolicies: Record<AppPlatform, AppVersionPolicy>;
};

const NEUTRAL_VERSION_POLICY: AppVersionPolicy = { minVersion: null, latestVersion: null };

const EMPTY_BASE: StatusBase = {
  isMaintenance: false,
  versionPolicies: {
    ios: NEUTRAL_VERSION_POLICY,
    android: NEUTRAL_VERSION_POLICY,
    web: NEUTRAL_VERSION_POLICY,
  },
};

/** The highest (by SemVer, not string order) of `rows`, or null if empty. */
const maxByVersion = <T extends { version: string }>(rows: T[]): T | null =>
  rows.reduce<T | null>(
    (max, row) => (!max || compareAppVersions(row.version, max.version) > 0 ? row : max),
    null,
  );

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  private l1: { base: StatusBase; expiresAt: number } | null = null;
  private pending: Promise<StatusBase> | null = null;

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly cache: CacheService,
  ) {}

  /**
   * L1 (this process' own memory) in front of L2 (Redis) in front of Postgres.
   * `AppVersionMiddleware` calls this on (almost) every request, so an L1 hit
   * -- the common case -- costs a timestamp comparison, no I/O at all. A
   * database failure fails open (maintenance off, nobody blocked) rather than
   * risk breaking every request in the app.
   */
  private async loadBase(): Promise<StatusBase> {
    if (this.l1 && this.l1.expiresAt > Date.now()) return this.l1.base;

    // Concurrent requests racing an expired/empty L1 share one refresh instead
    // of each hitting Redis (or Postgres) at once.
    this.pending ??= this.refreshBase().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async refreshBase(): Promise<StatusBase> {
    const base = (await this.cache.get<StatusBase>(STATUS_CACHE_KEY)) ?? (await this.loadFromDb());
    this.l1 = { base, expiresAt: Date.now() + L1_CACHE_TTL_MS };
    return base;
  }

  private async loadFromDb(): Promise<StatusBase> {
    try {
      const [[isMaintenanceRecord], liveRows] = await Promise.all([
        this.db.select().from(systemConfig).where(eq(systemConfig.key, 'is_maintenance')),
        this.db.select().from(versionPolicy).where(eq(versionPolicy.state, 'live')),
      ]);

      const base: StatusBase = {
        isMaintenance: isMaintenanceRecord ? !!isMaintenanceRecord.value : false,
        versionPolicies: Object.fromEntries(
          APP_PLATFORMS.map((platform) => {
            const rows = liveRows.filter((row) => row.platform === platform);
            return [
              platform,
              {
                minVersion: maxByVersion(rows.filter((row) => row.isBreaking))?.version ?? null,
                latestVersion: maxByVersion(rows)?.version ?? null,
              },
            ];
          }),
        ) as Record<AppPlatform, AppVersionPolicy>,
      };

      await this.cache.set(STATUS_CACHE_KEY, base, APP_VERSION_RULES.POLICY_CACHE_TTL_SECONDS);
      return base;
    } catch (error) {
      this.logger.error(
        'Failed to load system status, falling back to safe defaults',
        error instanceof Error ? error.stack : error,
      );
      return EMPTY_BASE;
    }
  }

  /**
   * `app` is null for callers that never sent their app headers (the web app
   * doesn't yet) -- they get a neutral `up_to_date` back.
   */
  async getStatus(app: { platform: AppPlatform; version: string } | null): Promise<StatusDto> {
    const base = await this.loadBase();
    const policy = app ? base.versionPolicies[app.platform] : NEUTRAL_VERSION_POLICY;
    const status = app ? evaluateAppVersionStatus(app.version, policy) : 'up_to_date';

    return parseResponseDto(StatusDto, {
      isMaintenance: base.isMaintenance,
      version: { status, minVersion: policy.minVersion, latestVersion: policy.latestVersion },
    });
  }

  /** Used by `AppVersionMiddleware`; `null` means "let the request through". */
  async getRequiredUpdate(headers: IncomingHttpHeaders): Promise<{ minVersion: string } | null> {
    const app = readAppVersionHeaders(headers);
    if (!app) return null;

    const base = await this.loadBase();
    const policy = base.versionPolicies[app.platform];
    const status = evaluateAppVersionStatus(app.version, policy);
    if (status !== 'update_required' || !policy.minVersion) return null;
    return { minVersion: policy.minVersion };
  }

  /**
   * Records a new release as `pending` for `platform`. This does NOT move
   * `minVersion`/`latestVersion` yet -- a store submission can sit in review
   * for hours or days, and enforcing (or even nudging towards) a version
   * nobody can download yet would be worse than not enforcing anything.
   * `confirmVersionLive` is what actually takes effect, once the store
   * confirms the version is available (see the provider webhooks under
   * `apps/api/src/app/webhooks`). `isBreaking` can only be known here --
   * from release-please's version bump, at release time -- never from the
   * store itself, so it's set once, on insert, and never touched again.
   */
  async updateVersionPolicy(
    platform: AppPlatform,
    version: string,
    isBreaking: boolean,
  ): Promise<void> {
    await this.db
      .insert(versionPolicy)
      .values({ platform, version, isBreaking })
      .onConflictDoNothing({ target: [versionPolicy.platform, versionPolicy.version] });
  }

  /**
   * Called once a store confirms `version` is actually available (see the provider
   * webhooks under `apps/api/src/app/webhooks`). A plain update, not an upsert --
   * `updateVersionPolicy` is what creates the row (with the right `isBreaking`);
   * if it hasn't run yet, this is a no-op rather than guessing.
   */
  async confirmVersionLive(platform: AppPlatform, version: string): Promise<void> {
    await this.db
      .update(versionPolicy)
      .set({ state: 'live' })
      .where(and(eq(versionPolicy.platform, platform), eq(versionPolicy.version, version)));

    // Take effect immediately on this pod, and on the next L1 miss elsewhere,
    // rather than waiting out the TTLs -- this is a rare, deliberate write,
    // not a hot path worth optimizing away. Other pods' own L1 still lag by
    // up to L1_CACHE_TTL_MS; there's no cheap way to reach into their memory.
    this.l1 = null;
    await this.cache.del(STATUS_CACHE_KEY);
  }
}
