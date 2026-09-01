import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lt } from 'drizzle-orm';
import { session } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deleteExpiredSessions() {
    try {
      const deleted = await this.db
        .delete(session)
        .where(lt(session.expiresAt, new Date().toISOString()))
        .returning({ id: session.id });

      if (deleted.length > 0) {
        this.logger.log(`Deleted ${deleted.length} expired session(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to delete expired sessions', error);
    }
  }
}
