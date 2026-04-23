import { Injectable, Inject, Logger } from '@nestjs/common';
import { ENV_SERVICE, EnvService } from '@libs/env';
import { profile } from '@libs/db/schemas';
import { eq } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from 'apps/api/src/common/modules/drizzle/drizzle.module';
import { z } from 'zod';

@Injectable()
export class WebhookRevenuecatService {
  private readonly logger = new Logger(WebhookRevenuecatService.name);

  constructor(
    @Inject(ENV_SERVICE) private readonly env: EnvService,
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async handleEvent(event: any) {
    const potentialIds = [
      event.app_user_id,
      ...(event.aliases || []),
      ...(event.transferred_from || []),
      ...(event.transferred_to || []),
    ].filter(Boolean);

    const validUuids = [...new Set(potentialIds)].filter((id: string) => 
      z.uuid().safeParse(id).success
    );

    if (validUuids.length === 0) {
      this.logger.log(`No valid UUID found in ${event.type} event. Ignoring DB update.`);
      return { success: true };
    }

    this.logger.log(`Received ${event.type}. Syncing ${validUuids.length} users...`);

    try {
      await Promise.all(validUuids.map(userId => this.syncSingleUser(userId)));
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process ${event.type} event`, error);
      throw error;
    }
  }

  private async syncSingleUser(userId: string) {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.env.REVENUECAT_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
       throw new Error(`RC API Error for ${userId}: ${response.status} ${response.statusText}`);
    }

    const rcData = await response.json();
    const premiumEntitlement = rcData.subscriber.entitlements['premium'];
    
    let isPremium = false;
    if (premiumEntitlement) {
      isPremium = premiumEntitlement.expires_date === null || new Date(premiumEntitlement.expires_date) > new Date();
    }

    await this.db.update(profile)
      .set({ isPremium })
      .where(eq(profile.id, userId));

    this.logger.log(`Synced user ${userId} -> isPremium: ${isPremium}`);
  }
}