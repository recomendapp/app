import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, inArray } from 'drizzle-orm';
import { versionPolicy } from '@libs/db/schemas';
import { APP_VERSION_RULES } from '@libs/rules';
import { DRIZZLE_SERVICE, type DrizzleService } from '../../common/modules/drizzle.module';
import { GooglePlayService } from '../../common/modules/google-play/google-play.service';

/**
 * Closes the gap App Store Connect's webhook closes for iOS: a release recorded by
 * the mobile CI stays `pending` until a store confirms it is actually downloadable,
 * and Play publishes no webhook to confirm it with. So we ask, hourly.
 *
 * Writes `version_policy` directly rather than calling the API: the API reads that
 * table through a Redis cache with a short TTL
 * (`APP_VERSION_RULES.POLICY_CACHE_TTL_SECONDS`), so it picks the change up on its
 * own within a minute -- irrelevant lag for a review that took hours.
 */
@Injectable()
export class StoreReleaseService implements OnModuleInit {
  private readonly logger = new Logger(StoreReleaseService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly googlePlay: GooglePlayService,
  ) {}

  onModuleInit(): void {
    if (!this.googlePlay.isConfigured) {
      this.logger.warn(
        'Android release polling disabled: GOOGLE_PLAY_RELEASE_READER_B64 and/or ANDROID_PACKAGE_NAME are unset',
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async confirmAndroidReleases(): Promise<void> {
    if (!this.googlePlay.isConfigured) return;

    try {
      // Every pending row, not just the newest: pushing 1.7.2 while 1.7.1 is still in
      // review leaves both pending, and either (or neither) may be the one that ships.
      const pending = await this.db
        .select({ version: versionPolicy.version })
        .from(versionPolicy)
        .where(and(eq(versionPolicy.platform, 'android'), eq(versionPolicy.state, 'pending')));

      if (pending.length === 0) return;

      const liveVersions = new Set(await this.googlePlay.getLiveProductionVersions());
      const confirmed = pending.map((row) => row.version).filter((v) => liveVersions.has(v));

      if (confirmed.length === 0) {
        this.logger.log(`Still pending on Play: ${pending.map((row) => row.version).join(', ')}`);
        return;
      }

      const updated = await this.db
        .update(versionPolicy)
        .set({ state: 'live' })
        .where(
          and(
            eq(versionPolicy.platform, 'android'),
            eq(versionPolicy.state, 'pending'),
            inArray(versionPolicy.version, confirmed),
          ),
        )
        .returning({ version: versionPolicy.version });

      this.logger.log(
        `Confirmed live on Play: ${updated.map((row) => row.version).join(', ')} ` +
          `(visible to the API within ${APP_VERSION_RULES.POLICY_CACHE_TTL_SECONDS}s)`,
      );
    } catch (error) {
      this.logger.error('Failed to confirm Android releases', error);
    }
  }
}
